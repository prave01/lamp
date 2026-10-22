import { Injectable, Logger } from "@nestjs/common";
import { CreateIdeaSchema, CreateIdeaSchemaType } from "./dto/create-idea.dto";
import { db } from "../database";
import { usersTable } from "../database/schema/sample";

@Injectable()
export class CreateIdeaService {
  private readonly logger = new Logger(CreateIdeaService.name);

  constructor() { }

  async generateIdea(input: CreateIdeaSchemaType): Promise<string> {
    try {
      const parse = CreateIdeaSchema.safeParse(input);

      if (!parse.success) throw new Error(parse.error.message);

      const res = await db
        .insert(usersTable)
        .values({
          name: "praveen",
          age: 10,
          email: "shi@email.com",
        })
        .returning();

      return JSON.stringify(res);
    } catch (err) {
      if (err instanceof Error) throw new Error(err.message);
      throw new Error("Unkown error");
    }
  }
}
