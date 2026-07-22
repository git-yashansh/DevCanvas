import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import type { ChatMessage } from "@types-pkg/index";

export const chatKeys = {
  messages: (projectId: string) => ["chat", "messages", projectId] as const,
};

export function useChatMessages(projectId: string | undefined) {
  return useQuery({
    queryKey: chatKeys.messages(projectId ?? ""),
    queryFn: async () => {
      if (!projectId) return [];
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, project_id, role, content, created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ChatMessage[];
    },
    enabled: !!projectId,
  });
}

export interface SendMessageInput {
  projectId: string;
  content: string;
}

export function useSendMessage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ projectId, content }: SendMessageInput) => {
      const { data, error } = await supabase
        .from("chat_messages")
        .insert({ project_id: projectId, role: "user", content })
        .select()
        .single();
      if (error) throw error;
      return data as ChatMessage;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: chatKeys.messages(data.project_id) });
    },
  });
}

export function useDeleteChatMessages() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (projectId: string) => {
      const { error } = await supabase
        .from("chat_messages")
        .delete()
        .eq("project_id", projectId);
      if (error) throw error;
    },
    onSuccess: (_data, projectId) => {
      qc.invalidateQueries({ queryKey: chatKeys.messages(projectId) });
    },
  });
}
