export const AI_CONFIG = {
  provider: Deno.env.get("AI_PROVIDER") || "gemini",
  // Unified, centralized model configuration as requested.
  // Never hardcode outside of this configuration.
  model: Deno.env.get("GEMINI_PRIMARY_MODEL") || "gemini-3.5-flash-lite",
};

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

export interface GeminiRequestOptions {
  contents: any[];
  generationConfig?: {
    temperature?: number;
    maxOutputTokens?: number;
    topP?: number;
    responseMimeType?: string;
  };
}

export interface GeminiResponse {
  reply: string;
  rawText: string;
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    totalTokenCount?: number;
  };
}

export class AIServiceError extends Error {
  status: number;
  code: string;
  retryAfterSeconds?: number;

  constructor(message: string, code: string, status = 500, retryAfterSeconds?: number) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.status = status;
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

/**
 * Maps HTTP status codes and response bodies from Gemini API to user-friendly structured error objects.
 */
export function handleGeminiError(status: number, text: string): AIServiceError {
  let errorMsg = text;
  let code = "INTERNAL_ERROR";
  let retryAfterSeconds: number | undefined;

  try {
    const parsed = JSON.parse(text);
    if (parsed.error?.message) {
      errorMsg = parsed.error.message;
    }
  } catch (_) {
    // Retain original text if not JSON
  }

  // Parse Google's rate limit string: "Please retry in 44.431422871s"
  const retryMatch = errorMsg.match(/retry in ([\d\.]+)s/i);
  if (retryMatch && retryMatch[1]) {
    retryAfterSeconds = Math.ceil(parseFloat(retryMatch[1]));
  }

  if (status === 400) {
    if (errorMsg.includes("API key") || errorMsg.includes("key not valid")) {
      code = "INVALID_API_KEY";
    } else if (errorMsg.includes("model")) {
      code = "MODEL_NOT_FOUND";
    } else {
      code = "INVALID_REQUEST";
    }
  } else if (status === 401 || status === 403) {
    code = "INVALID_API_KEY";
  } else if (status === 404) {
    code = "MODEL_NOT_FOUND";
  } else if (status === 429) {
    if (errorMsg.toLowerCase().includes("quota")) {
      code = "QUOTA_EXCEEDED";
    } else {
      code = "RATE_LIMITED";
    }
    // Default fallback retry if header/message didn't specify
    if (!retryAfterSeconds) {
      retryAfterSeconds = 15;
    }
  } else if (status === 503 || status === 504) {
    code = "SERVICE_UNAVAILABLE";
    retryAfterSeconds = 10;
  }

  return new AIServiceError(errorMsg, code, status, retryAfterSeconds);
}

/**
 * Executes a call to the Google Gemini API using the centralized model.
 * Handles exponential backoff retries on transient errors and limits (429).
 */
export async function callGemini(options: GeminiRequestOptions): Promise<GeminiResponse> {
  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new AIServiceError("AI service not configured. Set GEMINI_API_KEY.", "INVALID_API_KEY", 503);
  }

  const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
  const model = AI_CONFIG.model;
  
  let attempt = 0;
  const maxRetries = 4; // Up to 5 total attempts
  let lastError: AIServiceError | Error | null = null;

  while (attempt <= maxRetries) {
    const startTime = Date.now();
    attempt++;

    try {
      console.log(`[AI Request] ID: ${requestId} | Model: ${model} | Attempt: ${attempt}/${maxRetries + 1}`);

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: options.contents,
            generationConfig: options.generationConfig,
          }),
        }
      );

      const duration = Date.now() - startTime;

      if (response.ok) {
        const data = await response.json();
        const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";
        const usage = data?.usageMetadata;

        console.log(
          `[AI Success] ID: ${requestId} | Model: ${model} | Duration: ${duration}ms | ` +
          `Prompt Tokens: ${usage?.promptTokenCount ?? "N/A"} | ` +
          `Candidate Tokens: ${usage?.candidatesTokenCount ?? "N/A"} | ` +
          `Total Tokens: ${usage?.totalTokenCount ?? "N/A"}`
        );

        return {
          reply: rawText,
          rawText,
          usageMetadata: usage,
        };
      }

      const errText = await response.text();
      const apiError = handleGeminiError(response.status, errText);

      console.warn(
        `[AI Failure] ID: ${requestId} | Model: ${model} | Attempt: ${attempt} | ` +
        `Status: ${response.status} | Code: ${apiError.code} | Message: ${apiError.message} | Duration: ${duration}ms`
      );

      lastError = apiError;

      // Transient errors: 429 Rate Limit, 503/504 Service Unavailable
      const isTransient = response.status === 429 || response.status === 503 || response.status === 504;
      if (isTransient && attempt <= maxRetries) {
        // Use explicit retryAfter if provided by API, otherwise fallback to exponential backoff
        const delayMs = apiError.retryAfterSeconds 
          ? (apiError.retryAfterSeconds * 1000) 
          : (Math.pow(2, attempt) * 1000 + Math.random() * 1000); // Exponential backoff with jitter
          
        console.log(`[AI Backoff] ID: ${requestId} | Waiting ${delayMs}ms before next retry...`);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }

      // Non-transient errors (e.g. 400 Bad Request, 401 Unauthorized) fail immediately
      break;

    } catch (err) {
      const duration = Date.now() - startTime;
      console.error(
        `[AI Network Exception] ID: ${requestId} | Model: ${model} | Attempt: ${attempt} | ` +
        `Message: ${err instanceof Error ? err.message : String(err)} | Duration: ${duration}ms`
      );

      lastError = new AIServiceError(
        err instanceof Error ? err.message : String(err),
        "NETWORK_ERROR",
        502
      );

      if (attempt <= maxRetries) {
        const delayMs = Math.pow(2, attempt) * 1000 + Math.random() * 1000;
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      break;
    }
  }

  // Exhausted retries or encountered unrecoverable error
  throw lastError || new AIServiceError("AI Service request failed", "INTERNAL_ERROR", 500);
}

/**
 * Parses JSON returned by AI models robustly, handling markdown blocks, extracted substrings, 
 * and raw control characters (e.g. unescaped newlines/tabs) inside string literals.
 */
export function robustJsonParse(rawText: string): any {
  try {
    return JSON.parse(rawText);
  } catch (initialErr) {
    let jsonString = rawText.trim();
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    try {
      return JSON.parse(jsonString);
    } catch (_) {
      let inString = false;
      let escaped = false;
      let cleaned = "";
      for (let i = 0; i < jsonString.length; i++) {
        const char = jsonString[i];
        if (char === '"' && !escaped) {
          inString = !inString;
          cleaned += char;
        } else if (char === '\\' && inString) {
          escaped = !escaped;
          cleaned += char;
        } else if (char === '\n' && inString) {
          cleaned += "\\n";
          escaped = false;
        } else if (char === '\r' && inString) {
          cleaned += "\\r";
          escaped = false;
        } else if (char === '\t' && inString) {
          cleaned += "\\t";
          escaped = false;
        } else {
          cleaned += char;
          escaped = false;
        }
      }

      try {
        return JSON.parse(cleaned);
      } catch (thirdErr) {
        throw new Error(`Invalid JSON syntax from AI: ${thirdErr.message}`);
      }
    }
  }
}
