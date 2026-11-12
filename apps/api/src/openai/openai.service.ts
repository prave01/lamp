import {
	Injectable,
	Logger,
	InternalServerErrorException,
	ServiceUnavailableException,
} from "@nestjs/common";
import OpenAI, { OpenAIError } from "openai";
import { executor, LLM_TOOL, ToolsResolver } from "../libs/tool";
import { OpenAIInput } from "../libs/ai";
import { zodTextFormat } from "openai/helpers/zod";
import { ZodObject } from "zod";
import pc from "picocolors";
import { ContextManager } from "./contextManager";
import { ResponseStreamEvent } from "openai/resources/responses/responses.js";

export interface GenerateTextResult {
	text: string;
	toolCalls: Array<{ name: string; callId: string; arguments: string }>;
}

interface ToolCallMeta {
	name: string;
	call_id: string;
}

export type SessionEvent =
	| { type: "text-delta"; delta: string }
	| { type: "tool-start"; toolName: string }
	| { type: "tool-complete"; toolName: string }
	| { type: "status"; status: string };

@Injectable()
export class OpenaiService {
	private readonly logger = new Logger(OpenaiService.name);
	private conversationHistory: OpenAI.Responses.ResponseInputItem[] = [];

	private openai: OpenAI;

	public isInstanceCreated: boolean;

	private llmTool: OpenAI.Responses.Tool[];
	private model: string;

	private apiKey: string;
	private baseUrl: string;
	private systemPrompt: string;
	private context: ContextManager;
	private serviceName: string;

	async createOpenAIInstance(
		serviceName: string,
		apiKey: string,
		baseUrl: string,
		systemPrompt: string,
		modelName: string,
		context?: ContextManager,
	) {
		if (apiKey && baseUrl && systemPrompt && serviceName) {
			this.apiKey = apiKey;
			this.baseUrl = baseUrl;
			this.systemPrompt = systemPrompt;
			this.model = modelName;
			this.serviceName = serviceName;

			if (context) {
				// sets the context provider
				this.context = context;

				await this.context.append({
					type: "message",
					role: "system",
					content: this.systemPrompt,
				});
			}

			const tool = ToolsResolver({
				agentId: "core",
				tools: ["tool-websearch"],
			});

			this.llmTool = LLM_TOOL(tool);

			this.openai = new OpenAI({
				baseURL: this.baseUrl,
				apiKey: this.apiKey,
			});

			this.isInstanceCreated = true;

			this.logger.log(
				`OpenAI instance created for ${pc.bgBlue(pc.black(serviceName))}`,
			);

			return "Session Created";
		}
	}

	async streamText(
		query: string,
		context: ContextManager,
		onEvent?: (event: ResponseStreamEvent) => void,
	): Promise<GenerateTextResult> {
		this.context = context;

		await this.context.append({
			type: "message",
			role: "user",
			content: query,
		});

		const MAX_TURNS = 2;

		for (let turn = 0; turn < MAX_TURNS; turn++) {
			const toolCallSet = new Map<string, ToolCallMeta>();

			const executedTools: GenerateTextResult["toolCalls"] = [];

			let finalText: string | undefined;

			const input = await this.context.load();

			try {
				const stream = this.openai.responses.stream({
					input,
					model: this.model,
					tools: this.llmTool,
					stream: true,
				});

				for await (const event of stream) {
					if (onEvent) {
						onEvent(event);
					}

					switch (event.type) {
						case "response.output_text.delta":
							process.stdout.write(pc.cyan(event.delta));
							break;

						case "response.output_text.done":
							finalText = event.text;
							break;

						case "response.output_item.added":
							if (event.item.type === "function_call" && event.item.id) {
								toolCallSet.set(event.item.id, {
									name: event.item.name,
									call_id: event.item.call_id,
								});
							}
							break;

						case "response.function_call_arguments.done": {
							const tool = toolCallSet.get(event.item_id);

							if (!tool) {
								this.logger.warn(
									`No tool metadata for item_id = ${event.item_id}; skipping.`,
								);
								break;
							}

							await this.context.append({
								type: "function_call",
								name: tool.name,
								arguments: event.arguments,
								call_id: tool.call_id,
							});

							const output = await this.executeToolSafely(
								tool.name,
								event.arguments,
							);

							await this.context.append({
								type: "function_call_output",
								call_id: tool.call_id,
								name: tool.name,
								output: output.toString(),
							});

							executedTools.push({
								name: tool.name,
								callId: tool.call_id,
								arguments: event.arguments,
							});
							break;
						}

						case "response.incomplete": {
							const message =
								event.response.error?.message ??
								"Model response incomplete for unknown reason.";
							this.logger.error(`Stream incomplete: ${message} `);
							throw new ServiceUnavailableException(message);
						}

						case "response.failed": {
							const message =
								event.response.error?.message ?? "Model response failed.";
							this.logger.error(`Stream failed: ${message} `);
							throw new InternalServerErrorException(message);
						}

						default:
							break;
					}
				}
			} catch (err) {
				if (err instanceof ServiceUnavailableException) throw err;
				if (err instanceof InternalServerErrorException) throw err;

				throw new InternalServerErrorException(
					"Failed to generate response from model.",
					{ cause: err },
				);
			}

			// No tools invoked this turn → we have the final answer.
			if (toolCallSet.size === 0) {
				if (!finalText) {
					this.logger.warn("Stream completed with no text and no tool calls.");
					throw new InternalServerErrorException("Model produced no output.");
				}

				await this.context.append({
					type: "message",
					role: "assistant",
					id: `msg_${Date.now()} `,
					status: "completed",
					content: [{ type: "output_text", text: finalText, annotations: [] }],
				});

				return { text: finalText, toolCalls: executedTools };
			}
		}

		throw new InternalServerErrorException(
			`Agent exceeded maximum of ${MAX_TURNS} turns without converging.`,
		);
	}

	async generateText(
		input: string,
		systemPrompt: string,
		outputSchema: ZodObject,
		model: string,
	) {
		try {
			if (!this.isInstanceCreated) {
				throw new Error("Please create an openai instance");
			}

			const messages: OpenAIInput = [
				{
					role: "system",
					content: systemPrompt,
				},
				{
					role: "user",
					content: input,
				},
			];

			const responses = await this.openai.responses.parse({
				input: messages,
				model: model,
				text: {
					format: zodTextFormat(outputSchema, "generate-session"),
				},
			});

			return responses.output_parsed;
		} catch (err) {
			throw err;
		}
	}

	/** Executes a tool and normalizes failures into a JSON error payload. */
	private async executeToolSafely(
		toolName: string,
		args: string,
	): Promise<string> {
		try {
			const result = await executor("core", `tool-${toolName}`, args);
			return typeof result === "string" ? result : JSON.stringify(result);
		} catch (err) {
			this.logger.error(
				`Tool "${toolName}" failed: ${(err as Error).message} `,
				(err as Error).stack,
			);
			return JSON.stringify({ error: (err as Error).message });
		}
	}

	getConversationHistory(): OpenAI.Responses.ResponseInputItem[] {
		return this.conversationHistory;
	}
}
