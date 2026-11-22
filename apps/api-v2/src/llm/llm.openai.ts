import OpenAI from "openai";
import { getConfig } from "../config";

const config = getConfig("openai");

const client = new OpenAI({
  apiKey: config.API_KEY,
  baseURL: config.BASE_URL,
});

export const runLoop = () => {
  const MAX_TURNS = 2;

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const stream = client;
  }
};
