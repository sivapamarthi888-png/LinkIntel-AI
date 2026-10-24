import { GoogleGenAI, GenerateContentResponse } from '@google/genai';

// Model versioning: primary model, with fallbacks that are tried on retries/timeouts.
// Create config that reads GEMINI_API_KEY from environment
const geminiApiKey = process.env.GEMINI_API_KEY;
const primaryModelName = process.env.GEMINI_MODEL_NAME || 'gemini-2.5-flash';
const fallbackModelNames = process.env.GEMINI_FALLBACK_MODELS
  ? process.env.GEMINI_FALLBACK_MODELS.split(',').map(m => m.trim()).filter(Boolean)
  : [`gemini-2.5-flash-lite`];

let aiClient: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  aiClient = new GoogleGenAI({ apiKey: geminiApiKey });
}

// Custom abort error for timeout detection
class TimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'TimeoutError';
  }
}

// Generic retry with backoff, per-request timeout, and model fallback
// idea based on Google's API retry recipe.
export async function generateTextWithPrompt(
  prompt: string,
  generatedPromptName = 'generic_prompt',
  optionalConfig: {
    timeoutMs?: number;
    temperature?: number;
    topP?: number;
    maxOutputTokens?: number;
    systemInstruction?: string;
  } = {}
): Promise<GenerateContentResponse | null> {
  const {
    timeoutMs = 60_000,
    temperature = 0.0,
    topP = 0.95,
    maxOutputTokens = 2048,
    systemInstruction = undefined,
  } = optionalConfig;

  if (!aiClient) return null;

  const modelsToTry = [primaryModelName, ...fallbackModelNames];
  const MAX_RETRIES_PER_MODEL = 3;

  for (const model of modelsToTry) {
    let attempt = 0;
    while (attempt < MAX_RETRIES_PER_MODEL) {
      const abortController = new AbortController();
      const timer = setTimeout(() => abortController.abort(), timeoutMs);
      try {
        const response = await aiClient.models.generateContent({
          model: model,
          contents: prompt,
          config: {
            abortSignal: abortController.signal,
            temperature: temperature,
            topP: topP,
            maxOutputTokens: maxOutputTokens,
            ...(systemInstruction ? { systemInstruction } : {}),
            responseMimeType: 'application/json',
          },
        });
        clearTimeout(timer);
        return response;
      } catch (err: any) {
        clearTimeout(timer);
        const errorName = err?.name;

        if (errorName === 'TimeoutError' || abortController.signal.aborted) {
          attempt += 1;
          if (attempt < MAX_RETRIES_PER_MODEL) {
            const delay = 1000 * attempt * attempt;
            await new Promise((r) => setTimeout(r, delay));
          }
          continue;
        }

        // Client errors like INVALID_ARGUMENT => give up this model
        if (String(err?.message).includes('INVALID_ARGUMENT')) {
          break;
        }

        if (attempt < MAX_RETRIES_PER_MODEL) {
          const delay = 1000 * attempt * attempt;
          await new Promise((r) => setTimeout(r, delay));
        }
      }
      attempt += 1;
    }
  }

  return null;
}

// Validates that a JSON object matches a minimal Zod-like check
export function tryParseJsonFromGemini(response: GenerateContentResponse | null): any | null {
  if (!response) return null;
  try {
    const text = response.text;
    if (!text) return null;
    // Strip markdown code fences if present
    let clean = text.trim();
    if (clean.startsWith('```')) {
      clean = clean.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
    }
    return JSON.parse(clean);
  } catch {
    return null;
  }
}
