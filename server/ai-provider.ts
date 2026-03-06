import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";

// ─── Shared types ────────────────────────────────────────

export type AIProvider = "claude" | "gemini";

export interface AIResponse {
  text: string;
}

export interface AIRequestOptions {
  systemPrompt: string;
  userPrompt: string;
  maxTokens: number;
}

// ─── Provider interface ──────────────────────────────────

interface AIClient {
  generate(options: AIRequestOptions): Promise<AIResponse>;
}

// ─── Claude provider ─────────────────────────────────────

class ClaudeClient implements AIClient {
  private client: Anthropic;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new Anthropic({ apiKey });
    this.model = model || "claude-sonnet-4-20250514";
  }

  async generate(options: AIRequestOptions): Promise<AIResponse> {
    const response = await this.client.messages.create({
      model: this.model,
      max_tokens: options.maxTokens,
      system: options.systemPrompt,
      messages: [{ role: "user", content: options.userPrompt }],
    });

    const text =
      response.content[0].type === "text" ? response.content[0].text : "";
    return { text };
  }
}

// ─── Gemini provider ─────────────────────────────────────

class GeminiClient implements AIClient {
  private genAI: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = model || "gemini-2.0-flash";
  }

  async generate(options: AIRequestOptions): Promise<AIResponse> {
    const model = this.genAI.getGenerativeModel({
      model: this.model,
      systemInstruction: options.systemPrompt,
    });

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: options.userPrompt }] }],
      generationConfig: {
        maxOutputTokens: options.maxTokens,
      },
    });

    const text = result.response.text();
    return { text };
  }
}

// ─── Provider manager ────────────────────────────────────

let currentProvider: AIProvider = "claude";
let clients: Partial<Record<AIProvider, AIClient>> = {};

export function initProviders() {
  if (process.env.ANTHROPIC_API_KEY) {
    clients.claude = new ClaudeClient(process.env.ANTHROPIC_API_KEY);
  }
  if (process.env.GEMINI_API_KEY) {
    clients.gemini = new GeminiClient(process.env.GEMINI_API_KEY);
  }

  // Auto-select: prefer whichever key is available, defaulting to claude
  if (!clients.claude && clients.gemini) {
    currentProvider = "gemini";
  }
}

export function setProvider(provider: AIProvider): void {
  if (!clients[provider]) {
    throw new Error(
      `Provider "${provider}" is not configured. Set the ${provider === "claude" ? "ANTHROPIC_API_KEY" : "GEMINI_API_KEY"} environment variable.`
    );
  }
  currentProvider = provider;
}

export function getProvider(): AIProvider {
  return currentProvider;
}

export function getAvailableProviders(): AIProvider[] {
  return (Object.keys(clients) as AIProvider[]);
}

export function getClient(): AIClient {
  const client = clients[currentProvider];
  if (!client) {
    throw new Error(
      `No AI provider configured. Set ANTHROPIC_API_KEY and/or GEMINI_API_KEY in your .env file.`
    );
  }
  return client;
}
