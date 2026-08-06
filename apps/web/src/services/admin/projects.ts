import { supabase } from "@/lib/supabase";

export interface AdminProjectListItem {
  id: string;
  name: string;
  description: string | null;
  status: string;
  visibility: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    email: string;
  } | null;
}

export class ProjectService {
  static async getProjects(): Promise<AdminProjectListItem[]> {
    const { data, error } = await supabase
      .from("projects")
      .select(`
        id,
        name,
        description,
        status,
        visibility,
        created_at,
        profiles:owner_id (
          full_name,
          email
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data as any[]) || [];
  }

  static async deleteProject(id: string): Promise<void> {
    const { error } = await supabase.from("projects").delete().eq("id", id);
    if (error) throw error;
  }
}
