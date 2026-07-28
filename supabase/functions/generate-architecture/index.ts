import { createClient } from "npm:@supabase/supabase-js@2.45.4";
import { callGemini, corsHeaders, AIServiceError, robustJsonParse } from "../_shared/ai-service.ts";

interface GenerateRequest {
  prompt: string;
}

const SYSTEM_PROMPT = `You are DevCanvas Architecture Generator, an expert software architect.
Given a natural language description of an application, produce a complete system architecture as JSON.
The JSON MUST follow this exact schema:

{
  "summary": string,
  "services": [
    {
      "id": string (short snake_case identifier),
      "name": string (human-readable name),
      "type": "api" | "worker" | "gateway" | "database" | "cache" | "queue" | "storage" | "client" | "external",
      "description": string,
      "technology": string (e.g. "Node.js", "PostgreSQL", "Redis"),
      "scaling": string (e.g. "horizontal", "vertical", "n/a")
    }
  ],
  "connections": [
    {
      "from": string (service id),
      "to": string (service id),
      "label": string (e.g. "REST", "gRPC", "SQL", "pub/sub"),
      "type": "sync" | "async"
    }
  ],
  "dataFlows": [
    {
      "id": string,
      "name": string,
      "steps": string[] (ordered list of service ids describing the flow)
    }
  ],
  "considerations": {
    "scaling": string[],
    "security": string[],
    "reliability": string[]
  },
  "estimatedCost": {
    "monthly": number (USD),
    "breakdown": { "service": string, "cost": number }[]
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

    const body: GenerateRequest = await req.json();
    if (!body.prompt || body.prompt.trim().length < 5) {
      return new Response(
        JSON.stringify({ error: "A prompt of at least 5 characters is required.", code: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood. I will return only valid JSON matching the schema." }] },
      { role: "user", parts: [{ text: `Generate the architecture for: ${body.prompt}` }] },
    ];

    const geminiRes = await callGemini({
      contents,
      generationConfig: {
        temperature: 0.4,
        maxOutputTokens: 4096,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    });

    const rawText = geminiRes.reply;

    const architecture = robustJsonParse(rawText);


    return new Response(
      JSON.stringify({ architecture }),
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

