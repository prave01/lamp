import z from "zod";

export const ToolDefinitionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  usageInstruction: z.string(),
  inputSchema: z.custom<z.ZodType>(),
  execute: z.custom<(args: any) => any>(),
});

export type ToolDefinition = z.infer<typeof ToolDefinitionSchema>;

export type CreateTool<TInputSchema extends z.ZodType = z.ZodType> = {
  name: string;
  description: string;
  usageInstruction: string;
  inputSchema: TInputSchema;
  execute: (input: z.infer<TInputSchema>) => Promise<any> | any;
};

export const ToolRegistrySchema = z.array(
  z.object({
    tool: ToolDefinitionSchema,
    availableFor: z.array(z.uuid()),
  }),
);

export const AgentSpecSchema = z.object({
  identity: z.object({
    id: z.uuid(),
    name: z.string(),
    description: z.string(),
  }),

  model: z.object({
    provider: z.enum(["anthropic", "openai"]).default("openai"),
    model: z.string(),
    settings: z.object({}),
  }),

  instructions: z.object({
    systemPrompt: z.string(),
  }),

  capabilities: z.array(z.string()),

  tools: z.array(ToolDefinitionSchema),

  connections: z.array(z.object({})),

  memory: z.object({
    enabled: z.boolean().default(false),
    config: z.object({}),
  }),

  triggers: z.array(z.object({})),

  execution: z.object({
    maxSteps: z.number().default(10),
    timeout: z.number().default(30000),
    retryPolicy: z.object({
      enabled: z.boolean().default(true),
      maxRetries: z.number().default(3),
    }),
  }),

  permissions: z.array(z.string()),

  version: z.object({
    versionNumber: z.string(),
  }),
});

export type AgentSpec = z.infer<typeof AgentSpecSchema>;

export type ToolRegistryType = z.infer<typeof ToolRegistrySchema>;
