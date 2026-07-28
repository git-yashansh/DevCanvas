import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { callGemini, corsHeaders, AIServiceError, robustJsonParse } from "../_shared/ai-service.ts";

const SYSTEM_PROMPT = `You are DevCanvas Deployment Planner, a senior Cloud Architect and DevSecOps engineer.
Given a prompt describing an application stack, produce a comprehensive multi-environment deployment plan as JSON.
The JSON MUST follow this exact schema:

{
  "summary": string (2-3 sentence overview of the deployment strategy),
  "dockerfile": string (a fully complete, valid Dockerfile including standard ports and security practices),
  "pipeline": string (a valid GitHub Actions YAML CI/CD workflow spec),
  "checklist": string[] (pre-flight checks and rollback strategies),
  "cost": [
    { "category": string, "monthly": number }
  ],
  "recommendations": string[],
  "security": [
    { "title": string, "severity": "critical" | "high" | "medium" | "low", "description": string, "solution": string }
  ]
}

Return ONLY valid JSON. No markdown fences, no explanations outside JSON.`;

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
    if (!body.prompt || body.prompt.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "A prompt of at least 10 characters is required.", code: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood. I will return only valid JSON matching the schema." }] },
      { role: "user", parts: [{ text: `Generate a deployment plan for: ${body.prompt}` }] },
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

    const plan = robustJsonParse(geminiRes.reply);

    return new Response(
      JSON.stringify({ plan }),
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
