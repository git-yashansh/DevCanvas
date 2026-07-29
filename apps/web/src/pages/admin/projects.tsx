import { useState, useEffect } from "react";
import { FolderGit2, Loader2, Download, Search, Trash2 } from "lucide-react";
import { Badge } from "@ui/index";
import { supabase } from "@/lib/supabase";

export function AdminProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  async function loadProjects() {
    setLoading(true);
    try {
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

      if (data) {
        setProjects(data);
      }
    } catch (err) {
      console.error("Failed to load projects:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProjects();
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? This will permanently delete all related workspace files and data.")) return;
    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (!error) {
        setProjects(projects.filter((p) => p.id !== projectId));
      }
    } catch (err) {
      console.error("Failed to delete project:", err);
    }
  };

  const filteredProjects = projects.filter((p) => {
    const profileObj = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
    return (
      p.name?.toLowerCase().includes(search.toLowerCase()) ||
      profileObj?.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      profileObj?.email?.toLowerCase().includes(search.toLowerCase())
    );
  });

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            SaaS Project Directories
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Analyze framework distributions, source sizes, generation success rates, and active repository hooks.
          </p>
        </div>
        <button
          onClick={loadProjects}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] rounded-xl text-xs font-heading font-bold text-white transition-all cursor-pointer"
        >
          Refresh Project Database
        </button>
      </div>

      {/* Projects List Table */}
      <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-white/[0.08] flex items-center justify-between">
          <span className="font-heading text-sm font-bold text-white">Active Projects Database</span>
          <div className="relative w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-neutral-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by project name or owner..."
              className="h-9 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 outline-none transition-all focus:border-orange-500/50 focus:bg-white/[0.06]"
            />
          </div>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <span className="text-xs text-neutral-500 font-mono">Loading projects...</span>
          </div>
        ) : filteredProjects.length === 0 ? (
          <div className="text-center py-20 text-xs text-neutral-500 font-mono">
            No projects found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-neutral-500 font-bold bg-white/[0.01]">
                  <th className="p-4 pl-6">Project Title</th>
                  <th className="p-4">Project ID</th>
                  <th className="p-4">Owner Profile</th>
                  <th className="p-4">Visibility</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Created Date</th>
                  <th className="p-4 pr-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[13px] text-neutral-300 font-sans">
                {filteredProjects.map((p) => {
                  const profileObj = Array.isArray(p.profiles) ? p.profiles[0] : p.profiles;
                  
                  return (
                    <tr key={p.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-4 pl-6">
                        <span className="font-semibold text-white">{p.name}</span>
                        {p.description && <p className="text-[10.5px] text-neutral-500 mt-0.5 line-clamp-1">{p.description}</p>}
                      </td>
                      <td className="p-4 font-mono text-[11px] text-neutral-450">{p.id}</td>
                      <td className="p-4 leading-snug">
                        <p className="font-semibold text-neutral-200">{profileObj?.full_name || "User"}</p>
                        <p className="text-[10.5px] text-neutral-500">{profileObj?.email || "n/a"}</p>
                      </td>
                      <td className="p-4 uppercase font-mono text-[11px]">{p.visibility}</td>
                      <td className="p-4">
                        <Badge variant="outline" className={`text-[10px] uppercase font-bold ${
                          p.status === "active" ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-neutral-800 border-neutral-700 text-neutral-400"
                        }`}>
                          {p.status}
                        </Badge>
                      </td>
                      <td className="p-4 font-mono text-[12px] text-neutral-450">
                        {new Date(p.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <button
                          onClick={() => handleDeleteProject(p.id)}
                          className="p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05] text-neutral-300 hover:text-red-400 transition-all cursor-pointer"
                          title="Delete Project"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
export default AdminProjectsPage;
