import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

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
        JSON.stringify({ error: "Missing authorization header." }),
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
        JSON.stringify({ error: "Unauthorized." }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const apiKey = Deno.env.get("GEMINI_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "AI service not configured. Set GEMINI_API_KEY." }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const body: GenerateRequest = await req.json();
    if (!body.prompt || body.prompt.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "A prompt of at least 5 characters is required." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const dialect = body.dialect ?? "postgresql";
    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood. I will return only valid JSON matching the schema." }] },
      { role: "user", parts: [{ text: `Generate a ${dialect} database schema for: ${body.prompt}` }] },
    ];

    const geminiRes = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents,
          generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 8192,
            topP: 0.9,
            responseMimeType: "application/json",
          },
        }),
      },
    );

    if (!geminiRes.ok) {
      const errText = await geminiRes.text();
      return new Response(
        JSON.stringify({ error: `Gemini API error (${geminiRes.status}): ${errText}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const geminiData = await geminiRes.json();
    const rawText =
      geminiData?.candidates?.[0]?.content?.parts?.[0]?.text ?? "";

    let schema: unknown;
    try {
      schema = JSON.parse(rawText);
    } catch {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        schema = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("AI did not return valid JSON.");
      }
    }

    return new Response(
      JSON.stringify({ schema }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Internal error." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
