import z from "zod";

export const CreateSessionSchema = z.object({
  title: z.string().describe("Generate title for the session"),
  description: z.string().describe("Generate descrption about the session"),
});

export type CreateSessionSchemaType = z.infer<typeof CreateSessionSchema>;
