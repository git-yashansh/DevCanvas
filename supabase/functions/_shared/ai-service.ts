export const AI_CONFIG = {
  provider: Deno.env.get("AI_PROVIDER") || "gemini",
  primaryModel: Deno.env.get("GEMINI_PRIMARY_MODEL") || "gemini-2.5-flash",
  fallbackModel: Deno.env.get("GEMINI_FALLBACK_MODEL") || "gemini-2.5-flash",
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

  constructor(message: string, code: string, status = 500) {
    super(message);
    this.name = "AIServiceError";
    this.code = code;
    this.status = status;
  }
}

let isInitialized = false;
let validatedPrimaryModel = "";
let validatedFallbackModel = "";

/**
 * Initializes and validates configured Gemini models by querying the list of available models on the API key.
 * If the configured primary model is not in the list or is not usable, it automatically detects the newest Flash model.
 */
export async function initializeAI() {
  if (isInitialized) return;

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new AIServiceError("AI service not configured. Set GEMINI_API_KEY.", "INVALID_API_KEY", 503);
  }

  // Log configurations at startup (without exposing secret key)
  console.log(`[AI Startup] AI_PROVIDER: ${Deno.env.get("AI_PROVIDER") || "gemini"}`);
  console.log(`[AI Startup] GEMINI_PRIMARY_MODEL: ${Deno.env.get("GEMINI_PRIMARY_MODEL") || "gemini-2.5-flash"}`);
  console.log(`[AI Startup] GEMINI_FALLBACK_MODEL: ${Deno.env.get("GEMINI_FALLBACK_MODEL") || "gemini-2.5-flash"}`);

  const apiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models";
  console.log(`[AI Startup] Fetching available models from ${apiEndpoint}`);

  let availableModels: string[] = [];
  try {
    const res = await fetch(`${apiEndpoint}?key=${apiKey}`);
    if (!res.ok) {
      const errText = await res.text();
      throw handleGeminiError(res.status, errText);
    }
    const data = await res.json();
    if (data.models) {
      availableModels = data.models.map((m: any) => m.name);
    }
  } catch (err) {
    console.error(`[AI Startup Error] Failed to retrieve available models:`, err);
    throw new AIServiceError(`Failed to fetch available Gemini models: ${err.message}`, "NETWORK_ERROR", 502);
  }

  console.log(`[AI Startup] Available models on API key:`, availableModels);

  // Version extraction logic to sort models descending
  const getModelVersion = (name: string): number => {
    const match = name.match(/gemini-(\d+)(?:\.(\d+))?/);
    if (!match) return 0;
    const major = parseInt(match[1], 10);
    const minor = match[2] ? parseInt(match[2], 10) : 0;
    return major * 1000 + minor;
  };

  const isFlash = (name: string): boolean => {
    const parts = name.split('/');
    const modelId = parts[1] || parts[0];
    return modelId.startsWith("gemini-") && modelId.includes("flash") && !modelId.includes("lite") && !modelId.includes("tts") && !modelId.includes("image");
  };

  const configPrimary = Deno.env.get("GEMINI_PRIMARY_MODEL") || "gemini-2.5-flash";
  const canonicalPrimary = configPrimary.startsWith("models/") ? configPrimary : `models/${configPrimary}`;

  let primaryExists = availableModels.includes(canonicalPrimary);

  // Perform quick test content generation call to ensure the model is actually active/usable for new users
  if (primaryExists) {
    console.log(`[AI Startup] Validating usability of primary model ${canonicalPrimary}...`);
    try {
      const testRes = await fetch(
        `${apiEndpoint}/${configPrimary.replace("models/", "")}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: "ping" }] }],
            generationConfig: { maxOutputTokens: 1 },
          }),
        }
      );
      if (!testRes.ok) {
        const testErrText = await testRes.text();
        console.warn(`[AI Startup] Primary model validation failed (status ${testRes.status}): ${testErrText}`);
        primaryExists = false; // Flag as unavailable/unusable
      } else {
        console.log(`[AI Startup] Primary model ${canonicalPrimary} is active and usable.`);
      }
    } catch (err) {
      console.warn(`[AI Startup] Primary model validation encountered network exception:`, err);
      primaryExists = false;
    }
  }

  if (primaryExists) {
    validatedPrimaryModel = configPrimary.replace("models/", "");
  } else {
    console.warn(`[AI Startup] Primary model '${configPrimary}' is not available or usable. Choosing the newest supported Flash model...`);
    const flashModels = availableModels.filter(isFlash);
    if (flashModels.length === 0) {
      throw new AIServiceError("No supported Gemini Flash models are available for this API key.", "MODEL_NOT_FOUND", 404);
    }
    // Sort descending by version number
    flashModels.sort((a, b) => getModelVersion(b) - getModelVersion(a));
    const selectedFlash = flashModels[0];
    validatedPrimaryModel = selectedFlash.replace("models/", "");
    console.log(`[AI Startup] Automatically selected newest Flash model: ${validatedPrimaryModel}`);
  }

  const configFallback = Deno.env.get("GEMINI_FALLBACK_MODEL") || "gemini-2.5-flash";
  const canonicalFallback = configFallback.startsWith("models/") ? configFallback : `models/${configFallback}`;

  let fallbackExists = availableModels.includes(canonicalFallback);
  if (fallbackExists && canonicalFallback === canonicalPrimary && !primaryExists) {
    fallbackExists = false; // Fallback matches failing primary model
  }

  if (fallbackExists) {
    validatedFallbackModel = configFallback.replace("models/", "");
  } else {
    validatedFallbackModel = validatedPrimaryModel;
  }

  console.log(`[AI Startup Completed] SDK: direct REST API`);
  console.log(`[AI Startup Completed] Endpoint: ${apiEndpoint}`);
  console.log(`[AI Startup Completed] Selected Primary Model: ${validatedPrimaryModel}`);
  console.log(`[AI Startup Completed] Selected Fallback Model: ${validatedFallbackModel}`);

  isInitialized = true;
}

/**
 * Maps HTTP status codes and response bodies from Gemini API to user-friendly structured error objects.
 */
export function handleGeminiError(status: number, text: string): AIServiceError {
  let errorMsg = text;
  let code = "INTERNAL_ERROR";

  try {
    const parsed = JSON.parse(text);
    if (parsed.error?.message) {
      errorMsg = parsed.error.message;
    }
  } catch (_) {
    // Retain original text if not JSON
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
  } else if (status === 503 || status === 504) {
    code = "SERVICE_UNAVAILABLE";
  }

  return new AIServiceError(errorMsg, code, status);
}

/**
 * Executes a call to the Google Gemini API using configured primary and fallback models.
 * Handles exponential backoff retries on transient errors and logs full execution details.
 */
export async function callGemini(options: GeminiRequestOptions): Promise<GeminiResponse> {
  await initializeAI();

  const apiKey = Deno.env.get("GEMINI_API_KEY");
  if (!apiKey) {
    throw new AIServiceError("AI service not configured. Set GEMINI_API_KEY.", "INVALID_API_KEY", 503);
  }

  // Generate a simple request ID for tracking across retries
  const requestId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 11);
  
  const models = [validatedPrimaryModel, validatedFallbackModel];
  const uniqueModels = [...new Set(models)]; // Eliminate duplicate calls if primary and fallback models are identical

  let lastError: AIServiceError | Error | null = null;

  for (const model of uniqueModels) {
    let attempt = 0;
    const maxRetries = 3;

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

        // Exponential backoff retries only on transient errors (Rate Limit/429, Unavailable/503/504)
        const isTransient = response.status === 429 || response.status === 503 || response.status === 504;
        if (isTransient && attempt <= maxRetries) {
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          console.log(`[AI Backoff] ID: ${requestId} | Waiting ${delayMs}ms before next retry...`);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        // Break retry loop for non-transient failures to switch models immediately or fail
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
          const delayMs = Math.pow(2, attempt - 1) * 1000;
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }
        break;
      }
    }
  }

  throw lastError || new AIServiceError("AI Service request failed", "INTERNAL_ERROR", 500);
}

/**
 * Parses JSON returned by AI models robustly, handling markdown blocks, extracted substrings, 
 * and raw control characters (e.g. unescaped newlines/tabs) inside string literals.
 */
export function robustJsonParse(rawText: string): any {
  // Try clean parsing first
  try {
    return JSON.parse(rawText);
  } catch (initialErr) {
    // Extract JSON block (handles markdown wrappers like ```json ... ```)
    let jsonString = rawText.trim();
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    // Try parsing again after block extraction
    try {
      return JSON.parse(jsonString);
    } catch (_) {
      // Escape raw control characters inside string literals (e.g. unescaped newlines/tabs)
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

      // Try parsing cleaned JSON
      try {
        return JSON.parse(cleaned);
      } catch (thirdErr) {
        console.error("[robustJsonParse Error] Failed to parse JSON even after cleaning:", thirdErr);
        console.error("[robustJsonParse Error] Original text sample:", rawText.slice(0, 500));
        throw new Error(`Invalid JSON syntax from AI: ${thirdErr.message}`);
      }
    }
  }
}

