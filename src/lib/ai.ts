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

interface ImageOptions {
  size?: string;
  model?: string;
  referenceImageDataUrl?: string | null;
}

function parseDataUrl(dataUrl: string) {
  const match = dataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) return null;

  return {
    mimeType: match[1],
    buffer: Buffer.from(match[2], "base64"),
  };
}

async function generateImageFromPrompt(config: AIConfig, prompt: string, options?: ImageOptions) {
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

async function generateImageWithFallback(config: AIConfig, prompt: string, options?: ImageOptions) {
  try {
    return await generateImageFromPrompt(config, prompt, options);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const fallbackModel = process.env.AI_IMAGE_FALLBACK_MODEL ?? "gemini-2.5-flash-image";
    const canFallback = message.includes("Image API error: 503") && options?.model && options.model !== fallbackModel;
    if (!canFallback) throw error;

    return generateImageFromPrompt(config, prompt, {
      ...options,
      model: fallbackModel,
      size: "1024x1024",
    });
  }
}

async function generateImageFromReference(config: AIConfig, prompt: string, options: ImageOptions) {
  const image = options.referenceImageDataUrl ? parseDataUrl(options.referenceImageDataUrl) : null;
  if (!image) {
    throw new Error("Failed to parse brand logo — check that the uploaded logo is a valid image");
  }

  const formData = new FormData();
  formData.append("model", options.model ?? MODELS.image);
  formData.append("prompt", prompt);
  formData.append("size", options.size ?? "1024x1024");
  formData.append("n", "1");
  formData.append("image", new Blob([image.buffer], { type: image.mimeType }), "brand-logo.png");

  const response = await fetch(`${config.baseUrl}/images/edits`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Image edit API error: ${response.status} ${await response.text()}`);
  }

  return response.json();
}

export async function generateImage(prompt: string, options?: ImageOptions) {
  const config = getAIConfig();

  if (options?.referenceImageDataUrl) {
    return generateImageFromReference(config, prompt, options);
  }

  return generateImageWithFallback(config, prompt, options);
}

export const MODELS = {
  tweet: process.env.AI_TWEET_MODEL ?? "claude-sonnet-4-6",
  design: process.env.AI_DESIGN_MODEL ?? "claude-sonnet-4-6",
  image: process.env.AI_IMAGE_MODEL ?? "gpt-image-2",
} as const;
