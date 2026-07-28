import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { callGemini, corsHeaders, AIServiceError, robustJsonParse } from "../_shared/ai-service.ts";

const SYSTEM_PROMPT = `You are DevCanvas API Generator, an expert API architect.
Given a natural language description, produce a complete REST API specification as JSON.
The JSON MUST follow this exact schema:

{
  "title": string,
  "version": string (e.g. "1.0.0"),
  "baseUrl": string (e.g. "/api/v1"),
  "summary": string,
  "endpoints": [
    {
      "id": string (snake_case),
      "method": "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
      "path": string (e.g. "/users/{id}"),
      "summary": string,
      "description": string,
      "tags": string[],
      "auth": "none" | "bearer" | "api-key" | "session",
      "pathParams": [{ "name": string, "type": string, "description": string }],
      "queryParams": [{ "name": string, "type": string, "required": boolean, "description": string }],
      "requestBody": {
        "contentType": string,
        "schema": object
      } | null,
      "responses": [
        {
          "status": number,
          "description": string,
          "schema": object | null
        }
      ]
    }
  ],
  "schemas": [
    {
      "name": string,
      "fields": [
        { "name": string, "type": string, "required": boolean, "description": string }
      ]
    }
  ],
  "authentication": {
    "type": "bearer" | "api-key" | "session" | "oauth2",
    "description": string
  },
  "considerations": {
    "security": string[],
    "versioning": string[],
    "performance": string[]
  }
}

Return ONLY valid JSON. No markdown fences, no explanations.`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header.", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError || !userData.user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized.", code: "UNAUTHORIZED" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body = await req.json();
    if (!body.prompt || body.prompt.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "A prompt of at least 5 characters is required.", code: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood. I will return only valid JSON matching the schema." }] },
      { role: "user", parts: [{ text: `Generate the REST API spec for: ${body.prompt}` }] },
    ];

    const geminiRes = await callGemini({
      contents,
      generationConfig: {
        temperature: 0.3,
        maxOutputTokens: 8192,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    });

    const rawText = geminiRes.reply;

    const spec = robustJsonParse(rawText);


    return new Response(
      JSON.stringify({ spec }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    const status = err instanceof AIServiceError ? err.status : 500;
    const code = err instanceof AIServiceError ? err.code : "INTERNAL_ERROR";
    return new Response(
      JSON.stringify({ 
        error: err instanceof Error ? err.message : "Internal error.", 
        code 
      }),
      { status, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

