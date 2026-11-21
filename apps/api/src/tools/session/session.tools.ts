import { Injectable } from "@nestjs/common";
import { createTool } from "..";
import z from "zod";
import { SessionService } from "../../session/session.service";
import { ToolDefinition } from "../tools.types";
import { db } from "../../database";

@Injectable()
export class SessionTools {
  public getSessionDetails: ToolDefinition;

  constructor() {
    this.getSessionDetails = createTool({
      name: "get-session-details",
      description: "Get the details of a session - including ",
      inputSchema: z.object({
        sessionId: z
          .string()
          .describe("The id of the session to get details for"),
      }),
      execute: async (input) => {
        const sessionDetails = db.query.sessionTable.findFirst({
          where: {
            id: input.sessionId,
          },
        });

        return sessionDetails;
      },
      usageInstruction:
        "This tool is used to get the details of a session. It takes a sessionId as input and returns the details of the session.",
    });
  }
}
