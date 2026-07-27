import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { callGemini, corsHeaders, AIServiceError, robustJsonParse } from "../_shared/ai-service.ts";

interface GenerateRequest {
  prompt: string;
  dialect?: "postgresql" | "mysql" | "sqlite";
}

const SYSTEM_PROMPT = `You are DevCanvas Database Designer, an expert database architect.
Given a natural language description of an application, produce a complete database schema as JSON.
The JSON MUST follow this exact schema:

{
  "summary": string,
  "tables": [
    {
      "id": string (short snake_case identifier),
      "name": string (table name),
      "description": string,
      "columns": [
        {
          "name": string,
          "type": string (e.g. "uuid", "text", "integer", "boolean", "timestamptz", "jsonb", "numeric"),
          "nullable": boolean,
          "primaryKey": boolean,
          "unique": boolean,
          "defaultValue": string | null,
          "description": string
        }
      ]
    }
  ],
  "relations": [
    {
      "from": string (table id),
      "to": string (table id),
      "fromColumn": string (column name in the "from" table),
      "toColumn": string (column name in the "to" table, usually "id"),
      "type": "one-to-one" | "one-to-many" | "many-to-many"
    }
  ],
  "indexes": [
    {
      "table": string (table id),
      "columns": string[],
      "type": "btree" | "gin" | "unique"
    }
  ],
  "considerations": {
    "normalization": string[],
    "indexing": string[],
    "scaling": string[]
  },
  "sql": string (complete CREATE TABLE + CREATE INDEX statements, no DROP, no INSERT)
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

    const body: GenerateRequest = await req.json();
    if (!body.prompt || body.prompt.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "A prompt of at least 5 characters is required.", code: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dialect = body.dialect ?? "postgresql";
    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood. I will return only valid JSON matching the schema." }] },
      { role: "user", parts: [{ text: `Generate a ${dialect} database schema for: ${body.prompt}` }] },
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

    const schema = robustJsonParse(rawText);


    return new Response(
      JSON.stringify({ schema }),
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

