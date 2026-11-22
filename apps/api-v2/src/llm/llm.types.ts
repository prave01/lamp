export type ToolCallMeta = {
  name: string;
  call_id: string;
};

export interface GenerateTextResult {
  text: string;
  toolCalls: Array<{ name: string; callId: string; arguments: string }>;
}
