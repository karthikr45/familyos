import Anthropic from '@anthropic-ai/sdk';
import { DEFAULT_MODEL, type ChatMessage, type TokenUsage, type UsageHandler } from './types';

export interface AiClientOptions {
  apiKey: string;
  model?: string;
  maxRetries?: number;
  onUsage?: UsageHandler;
}

export interface CompleteOptions {
  system?: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  feature?: string;
}

export interface CompleteResult {
  text: string;
  usage: TokenUsage;
}

/**
 * Thin wrapper around the Anthropic SDK that centralises model selection,
 * retry behaviour, token-usage reporting, and JSON parsing for the FamilyOS
 * AI services.
 */
export class AiClient {
  private readonly anthropic: Anthropic;
  private readonly model: string;
  private readonly onUsage?: UsageHandler;

  constructor(options: AiClientOptions) {
    if (!options.apiKey) {
      throw new Error('AiClient requires an Anthropic API key (ANTHROPIC_API_KEY).');
    }
    this.anthropic = new Anthropic({
      apiKey: options.apiKey,
      maxRetries: options.maxRetries ?? 3,
    });
    this.model = options.model ?? DEFAULT_MODEL;
    this.onUsage = options.onUsage;
  }

  private async reportUsage(feature: string, usage: TokenUsage): Promise<void> {
    if (this.onUsage) {
      try {
        await this.onUsage(feature, usage);
      } catch {
        // Usage tracking must never break the primary request.
      }
    }
  }

  async complete(options: CompleteOptions): Promise<CompleteResult> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      system: options.system,
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const usage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
    await this.reportUsage(options.feature ?? 'complete', usage);

    return { text, usage };
  }

  /**
   * Completes and parses a JSON object from the model output. The model is
   * instructed to return JSON; we defensively extract the first JSON block in
   * case it wraps the response in prose or fences.
   */
  async completeJson<T>(options: CompleteOptions): Promise<T> {
    const system = [
      options.system,
      'Respond with a single valid JSON value and nothing else. Do not wrap it in markdown fences.',
    ]
      .filter(Boolean)
      .join('\n\n');

    const { text } = await this.complete({ ...options, system, temperature: options.temperature ?? 0.4 });
    return parseJson<T>(text);
  }

  /**
   * Streams a completion as an async iterable of text deltas. Token usage is
   * reported once the stream finishes.
   */
  async *stream(options: CompleteOptions): AsyncGenerator<string, void, unknown> {
    const stream = this.anthropic.messages.stream({
      model: this.model,
      max_tokens: options.maxTokens ?? 1024,
      temperature: options.temperature ?? 0.7,
      system: options.system,
      messages: options.messages.map((m) => ({ role: m.role, content: m.content })),
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
        yield event.delta.text;
      }
    }

    const finalMessage = await stream.finalMessage();
    await this.reportUsage(options.feature ?? 'stream', {
      inputTokens: finalMessage.usage.input_tokens,
      outputTokens: finalMessage.usage.output_tokens,
    });
  }

  /** Vision helper: send a base64 image plus a text prompt. */
  async analyzeImage(
    imageBase64: string,
    prompt: string,
    feature = 'vision',
    mediaType: 'image/jpeg' | 'image/png' | 'image/webp' = 'image/jpeg',
  ): Promise<CompleteResult> {
    const response = await this.anthropic.messages.create({
      model: this.model,
      max_tokens: 1024,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            { type: 'text', text: prompt },
          ],
        },
      ],
    });

    const text = response.content
      .filter((block): block is Anthropic.TextBlock => block.type === 'text')
      .map((block) => block.text)
      .join('');

    const usage: TokenUsage = {
      inputTokens: response.usage.input_tokens,
      outputTokens: response.usage.output_tokens,
    };
    await this.reportUsage(feature, usage);
    return { text, usage };
  }
}

export function parseJson<T>(text: string): T {
  const trimmed = text.trim();
  try {
    return JSON.parse(trimmed) as T;
  } catch {
    // Extract the first {...} or [...] block as a fallback.
    const match = trimmed.match(/[[{][\s\S]*[\]}]/);
    if (match) {
      return JSON.parse(match[0]) as T;
    }
    throw new Error('Failed to parse JSON from model response.');
  }
}

let singleton: AiClient | null = null;

/** Lazily create a shared AiClient from the environment. */
export function getAiClient(onUsage?: UsageHandler): AiClient {
  if (!singleton) {
    singleton = new AiClient({ apiKey: process.env.ANTHROPIC_API_KEY ?? '', onUsage });
  }
  return singleton;
}
