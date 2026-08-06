import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";
import { callGemini, corsHeaders, AIServiceError } from "../_shared/ai-service.ts";

interface ChatRequest {
  messages: { role: "user" | "assistant" | "system"; content: string }[];
  context?: string;
}

const SYSTEM_PROMPT = `You are DevCanvas AI, an expert software engineering assistant.
You help engineers design architectures, design databases, generate APIs, write boilerplate code,
analyze security, estimate costs, and prepare for system design interviews.
Be concise, technical, and opinionated. Use markdown formatting.
When suggesting code, use fenced code blocks with the correct language tag.
When suggesting architecture, describe services, data flows, and trade-offs explicitly. and always give best industry grade response. never refuse a user query keep a positive attitude `;

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

    const body: ChatRequest = await req.json();
    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Messages array is required.", code: "BAD_REQUEST" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const contents = [
      { role: "user", parts: [{ text: SYSTEM_PROMPT }] },
      { role: "model", parts: [{ text: "Understood. I'm DevCanvas AI, ready to help." }] },
      ...body.messages.map((m) => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];

    const geminiRes = await callGemini({
      contents,
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 2048,
        topP: 0.95,
      },
    });

    return new Response(
      JSON.stringify({ reply: geminiRes.reply }),
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

