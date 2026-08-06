import { supabase } from "@/lib/supabase";
import type { UserFeedback } from "./types";

export class FeedbackService {
  static async getFeedback(): Promise<UserFeedback[]> {
    const { data, error } = await supabase
      .from("user_feedback")
      .select(`
        id,
        user_id,
        category,
        rating,
        comment,
        status,
        votes,
        created_at,
        profiles:user_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as any[]) || [];
  }

  static async updateFeedbackStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from("user_feedback")
      .update({ status })
      .eq("id", id);
    if (error) throw error;
  }

  static async deleteFeedback(id: string): Promise<void> {
    const { error } = await supabase.from("user_feedback").delete().eq("id", id);
    if (error) throw error;
  }
}
