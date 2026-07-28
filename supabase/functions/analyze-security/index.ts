import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { callGemini, corsHeaders, AIServiceError, robustJsonParse } from "../_shared/ai-service.ts";

const SYSTEM_PROMPT = `You are DevCanvas Security Analyzer, an expert application security engineer.
Given a description of an application (tech stack, architecture, features, code snippets), produce a comprehensive security analysis as JSON.
The JSON MUST follow this exact schema:

{
  "score": number (0-100, 100 = perfect security),
  "grade": "A+" | "A" | "B" | "C" | "D" | "F",
  "summary": string,
  "findings": [
    {
      "id": string (short snake_case),
      "title": string,
      "severity": "critical" | "high" | "medium" | "low" | "info",
      "category": string (e.g. "OWASP A01 - Broken Access Control"),
      "description": string,
      "impact": string,
      "remediation": string,
      "references": string[]
    }
  ],
  "categoryScores": [
    {
      "name": string (e.g. "Authentication", "Authorization", "Encryption"),
      "score": number (0-100),
      "status": "Secure" | "Needs Improvement" | "Critical"
    }
  ],
  "riskFindings": [
    {
      "title": string,
      "level": "Critical" | "High" | "Medium" | "Low",
      "likelihood": "Likely" | "Possible" | "Unlikely",
      "impact": "Severe" | "Major" | "Moderate" | "Minor",
      "priority": "P0" | "P1" | "P2" | "P3",
      "component": string,
      "status": "Open" | "Mitigated"
    }
  ],
  "complianceItems": [
    {
      "standard": string (e.g. "OWASP Top 10", "SOC 2 Type II", "GDPR"),
      "status": "Pass" | "Warning" | "Fail",
      "progress": number (0-100),
      "scope": string,
      "recs": string
    }
  ],
  "owaspCoverage": [
    {
      "id": string (e.g. "A01"),
      "name": string (e.g. "Broken Access Control"),
      "status": "pass" | "fail" | "warning" | "n/a",
      "notes": string
    }
  ],
  "recommendations": {
    "immediate": string[],
    "shortTerm": string[],
    "longTerm": string[]
  },
  "positives": string[]
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
    if (!body.prompt || body.prompt.trim().length < 10) {
      return new Response(
        JSON.stringify({ error: "A description of at least 10 characters is required.", code: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood. I will return only valid JSON matching the schema." }] },
      { role: "user", parts: [{ text: `Analyze the security of: ${body.prompt}` }] },
    ];

    const geminiRes = await callGemini({
      contents,
      generationConfig: {
        temperature: 0.2,
        maxOutputTokens: 8192,
        topP: 0.9,
        responseMimeType: "application/json",
      },
    });

    const rawText = geminiRes.reply;

    const analysis = robustJsonParse(rawText);


    return new Response(
      JSON.stringify({ analysis }),
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

