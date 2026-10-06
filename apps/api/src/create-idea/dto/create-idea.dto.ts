import { z } from "zod";

export const CreateIdeaSchema = z.object({
  idea: z.string(),
});

export type CreateIdeaSchemaType = z.infer<typeof CreateIdeaSchema>;
