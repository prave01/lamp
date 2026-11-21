import z from "zod";

export const CreateContainerSchema = z.object({
  sandboxId: z.string(),
  options: z.object({
    name: z.string(),
    image: z.string().optional().default("agent-runtime:latest"),
    workingDir: z.string().optional().default("/workspace"),
    description: z.string(),
  }),
});

export type CreateContainer = z.infer<typeof CreateContainerSchema>;
