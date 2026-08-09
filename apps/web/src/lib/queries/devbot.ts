import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface DevBotMessage {
  id: string;
  user_id: string;
  role: "user" | "assistant" | "system";
  content: string;
  created_at: string;
}

export const devbotKeys = {
  messages: () => ["devbot", "messages"] as const,
};

const DEVBOT_KNOWLEDGE_PROMPT = `[SYSTEM INSTRUCTION]
You are DevBot, the AI guide for DevCanvas. Your sole purpose is to help the user navigate and use the DevCanvas application.
Do not hallucinate features. Only explain features that actually exist in the current application.

Available Features and Modules in DevCanvas:
1. Dashboard (/app): View project overview, recent activity, quick tools access.
2. AI Project Generator (/app/workspace): Describe a software idea to generate project concepts, spec briefs, and visual designs.
3. Architecture Design (/app/architecture): Design system architectures, edit components and relations, view topologies.
4. Database Designer (/app/database): Design tables, define entities and relationships, generate SQL database schemas.
5. API Spec Generator (/app/api-generator): Design API endpoints, define request/response schemas, generate OpenAPI/Rest specs.
6. Security Center (/app/security): Audit security, check OWASP threat mappings, and security alerts.
7. Repo Analyzer (/app/repo): Analyze code repositories, explore files, replay walkthroughs.
8. Documentation Generator (/app/documentation): Generate technical manuals, user guides, or APIs specs documentation.
9. DevOps / Deployment (/app/deployment): Generate deployment plans, Docker configs, and CI/CD pipelines.
10. Projects List (/app/projects): View and manage generated projects and saved engineering artifacts.
11. Support & Customer Care (/app/support): Raise tickets, chat with admin/support, track resolution progress.
12. Settings (/app/settings): Update display name, profile details, and account settings.
13. Admin Panel (/admin/dashboard): Access dashboard stats, manage users, handle support tickets, view audit logs, notifications, security status, and system monitoring. (Only accessible for admin/support/moderator roles).

When suggesting navigation, format the buttons EXACTLY as:
[Open Page Name|/route]
For example:
- To go to Database Designer: [Open Database Designer|/app/database]
- To go to API Spec Generator: [Open API Spec Generator|/app/api-generator]
- To go to Support: [Open Support|/app/support]
- To go to Settings: [Open Settings|/app/settings]
- To go to Architecture: [Open Architecture|/app/architecture]

Answer in a helpful guide persona. Keep steps clear and numbered where possible.
`;

export function useDevBotMessages() {
  return useQuery({
    queryKey: devbotKeys.messages(),
    queryFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return [];

      const { data, error } = await supabase
        .from("devbot_messages")
        .select("id, user_id, role, content, created_at")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as DevBotMessage[];
    },
  });
}

export function useSendDevBotMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ content, currentRoute, userRole }: { content: string; currentRoute: string; userRole: string }) => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      // 1. Save user's message locally
      const { data: userMsg, error: userError } = await supabase
        .from("devbot_messages")
        .insert({
          user_id: session.user.id,
          role: "user",
          content,
        })
        .select()
        .single();
      if (userError) throw userError;

      // Optimistically append user message
      qc.setQueryData(devbotKeys.messages(), (old: DevBotMessage[] = []) => [...old, userMsg]);

      // 2. Fetch history
      const { data: historyData } = await supabase
        .from("devbot_messages")
        .select("role, content")
        .eq("user_id", session.user.id)
        .order("created_at", { ascending: true });

      const messagesForAI = [
        {
          role: "user" as const,
          content: `${DEVBOT_KNOWLEDGE_PROMPT}\nUser's Current Page: ${currentRoute}\nUser's Account Role: ${userRole}\n`,
        },
        {
          role: "assistant" as const,
          content: "Understood. I am DevBot, your guide for DevCanvas. I will help you with active navigation and explain features.",
        },
        ...(historyData || []).map((h) => ({
          role: h.role as "user" | "assistant",
          content: h.content,
        })),
      ];

      // 3. Query Edge Function
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/gemini-chat`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({ messages: messagesForAI }),
        }
      );

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(errText || "Error connecting to AI guide.");
      }

      const resData = await response.json();
      const reply = resData.reply || "I encountered an issue processing your query. Please try again.";

      // 4. Save bot message
      const { data: botMsg, error: botError } = await supabase
        .from("devbot_messages")
        .insert({
          user_id: session.user.id,
          role: "assistant",
          content: reply,
        })
        .select()
        .single();
      if (botError) throw botError;

      return botMsg as DevBotMessage;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devbotKeys.messages() });
    },
  });
}

export function useClearDevBotMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("devbot_messages")
        .delete()
        .eq("user_id", session.user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: devbotKeys.messages() });
    },
  });
}
