import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";

export interface ActivityItem {
  id: string;
  content: string;
  created_at: string;
  project_id: string;
}

export function useRecentActivity(limit = 6) {
  return useQuery({
    queryKey: ["activity", "recent", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("chat_messages")
        .select("id, content, created_at, project_id")
        .eq("role", "system")
        .order("created_at", { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ActivityItem[];
    },
  });
}
