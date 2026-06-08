export interface AIConfig {
  baseUrl: string;
  apiKey: string;
}

function getAIConfig(): AIConfig {
  const baseUrl = process.env.AI_API_BASE_URL;
  const apiKey = process.env.AI_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error("AI_API_BASE_URL and AI_API_KEY must be set");
  }

  return { baseUrl, apiKey };
}

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ChatOptions {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
}

export async function chatCompletion(options: ChatOptions) {
  const config = getAIConfig();

  const response = await fetch(`${config.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: options.model,
      messages: options.messages,
      temperature: options.temperature ?? 0.8,
      max_tokens: options.max_tokens ?? 2048,
    }),
  });

  if (!response.ok) {
    throw new Error(`AI API error: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export async function generateImage(prompt: string, options?: { size?: string; model?: string }) {
  const config = getAIConfig();

  const response = await fetch(`${config.baseUrl}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: options?.model ?? "dall-e-3",
      prompt,
      size: options?.size ?? "1024x1024",
      n: 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Image API error: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export const MODELS = {
  tweet: process.env.AI_TWEET_MODEL ?? "claude-sonnet-4-20250514",
  design: process.env.AI_DESIGN_MODEL ?? "claude-sonnet-4-20250514",
  image: process.env.AI_IMAGE_MODEL ?? "dall-e-3",
} as const;
