import z from "zod";
import { Firecrawl } from "firecrawl";
import { ToolDefinition } from "../tools.types";
import { Injectable } from "@nestjs/common";
import { createTool } from "..";

@Injectable()
export class WebTools {
  public webSearchTool: ToolDefinition;

  constructor() {
    this.webSearchTool = createTool({
      name: "websearch",
      description: "Searches the web",
      usageInstruction: "Only make 2 request",
      inputSchema: z.object({
        query: z.string().describe("The query that user is passing"),
      }),
      execute: async ({ query }: { query: string }) => {
        const fc = new Firecrawl({
          apiKey: "fc-13b19311549943358a00ddef07584f1c",
        });

        const response = await fc.search("https://thepraveen.vercel.app", {
          limit: 2,
          scrapeOptions: {
            formats: ["markdown"],
          },
        });

        if (!response.web || response.web.length === 0) {
          throw new Error("No search results found");
        }

        const result = response.web[0];

        if ("markdown" in result) {
          return result?.markdown;
        }

        throw new Error("No markdown found in search results");
      },
    });
  }
}
