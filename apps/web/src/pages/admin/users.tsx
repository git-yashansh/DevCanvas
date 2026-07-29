import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  Download,
  UserX,
  UserCheck,
  Trash2,
  Activity,
  ChevronLeft,
  ChevronRight,
  Loader2,
  FolderGit2,
} from "lucide-react";
import { Badge } from "@ui/index";
import { cn } from "@utils/index";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export function AdminUsersPage() {
  const navigate = useNavigate();
  const { user: currentAdminUser } = useAuth();
  
  const [profiles, setProfiles] = useState<any[]>([]);
  const [projectsCountMap, setProjectsCountMap] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  async function loadData() {
    setLoading(true);
    try {
      // 1. Fetch profiles
      const { data: profilesData } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      // 2. Fetch projects to map counts in-memory
      const { data: projectsData } = await supabase
        .from("projects")
        .select("owner_id");

      if (profilesData) {
        setProfiles(profilesData);
      }

      if (projectsData) {
        const counts: Record<string, number> = {};
        projectsData.forEach((p) => {
          counts[p.owner_id] = (counts[p.owner_id] || 0) + 1;
        });
        setProjectsCountMap(counts);
      }
    } catch (err) {
      console.error("Failed to load user management details:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  // Update role handler
  const handleUpdateRole = async (userId: string, newRole: string) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ role: newRole })
        .eq("id", userId);

      if (!error) {
        setProfiles(profiles.map((p) => (p.id === userId ? { ...p, role: newRole } : p)));
        
        // Log admin audit action
        if (currentAdminUser) {
          await supabase.from("audit_logs").insert({
            actor_id: currentAdminUser.id,
            action: "Updated User Role",
            entity: `profiles (${userId})`,
            details: { new_role: newRole },
            result: "success",
          });
        }
      }
    } catch (err) {
      console.error("Failed to update user role:", err);
    }
  };

  // Delete profile handler
  const handleDeleteUser = async (userId: string) => {
    if (!confirm("Are you sure you want to delete this user profile? This action is irreversible.")) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (!error) {
        setProfiles(profiles.filter((p) => p.id !== userId));
        
        // Log admin audit action
        if (currentAdminUser) {
          await supabase.from("audit_logs").insert({
            actor_id: currentAdminUser.id,
            action: "Deleted User Profile",
            entity: `profiles (${userId})`,
            result: "success",
          });
        }
      }
    } catch (err) {
      console.error("Failed to delete user profile:", err);
    }
  };

  // Filter logs logic
  const filteredUsers = profiles.filter((u) => {
    const matchesSearch =
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-white/[0.08] pb-5">
        <div>
          <h1 className="font-heading text-2xl font-black text-white tracking-wide">
            User Operations Management
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Browse registered SaaS users, audit active usage parameters, adjust authorization roles, and toggle account states.
          </p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-white/[0.03] border border-white/10 hover:border-white/20 hover:bg-white/[0.06] rounded-xl text-xs font-heading font-bold text-white transition-all cursor-pointer"
        >
          Refresh User Base
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#0B0C0E]/40 p-4 border border-white/[0.06] rounded-2xl">
        <div className="relative w-full md:w-80">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name or email..."
            className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] pl-9 pr-3 text-xs text-white placeholder:text-neutral-500 outline-none transition-all focus:border-orange-500/50 focus:bg-white/[0.06]"
          />
        </div>

        <div className="flex items-center gap-3.5 w-full md:w-auto flex-wrap">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400">Role:</span>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-neutral-900 border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-orange-500"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrator</option>
              <option value="support">Support Operator</option>
              <option value="moderator">Moderator</option>
              <option value="user">Standard User</option>
            </select>
          </div>
        </div>
      </div>

      {/* Users List Table */}
      <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
            <span className="text-xs text-neutral-500 font-mono">Loading user list...</span>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="text-center py-20 text-xs text-neutral-500 font-mono">
            No profiles matching your query.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] text-[11px] uppercase tracking-wider text-neutral-500 font-bold bg-white/[0.01]">
                  <th className="p-4 pl-6">Profile Details</th>
                  <th className="p-4">Owner ID</th>
                  <th className="p-4">Permissions Role</th>
                  <th className="p-4">Projects Created</th>
                  <th className="p-4">Joined Date</th>
                  <th className="p-4 pr-6 text-right">Operations Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04] text-[13px] text-neutral-300 font-sans">
                {filteredUsers.map((u) => {
                  const pCount = projectsCountMap[u.id] || 0;
                  return (
                    <tr key={u.id} className="hover:bg-white/[0.01] transition-all">
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="relative p-[1px] rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 shrink-0">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-900 text-xs font-bold text-white uppercase border border-[#0B0C0E]">
                              {u.full_name?.charAt(0) || u.email?.charAt(0) || "U"}
                            </div>
                          </div>
                          <div className="leading-tight">
                            <p className="font-semibold text-white">{u.full_name || "New User"}</p>
                            <p className="text-[10.5px] text-neutral-500 mt-0.5">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[11px] text-neutral-450">{u.id}</td>
                      <td className="p-4">
                        {/* Interactive Role Selector */}
                        <select
                          value={u.role}
                          onChange={(e) => handleUpdateRole(u.id, e.target.value)}
                          className="bg-neutral-900 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:border-orange-500"
                        >
                          <option value="user">User</option>
                          <option value="admin">Admin</option>
                          <option value="support">Support</option>
                          <option value="moderator">Moderator</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1.5 font-semibold text-neutral-250">
                          <FolderGit2 className="h-4 w-4 text-orange-400/80" />
                          <span className="font-mono">{pCount}</span>
                        </div>
                      </td>
                      <td className="p-4 font-mono text-[12px] text-neutral-450">
                        {new Date(u.created_at).toLocaleDateString()}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => navigate(`/admin/users/${u.id}`)}
                            className="p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05] text-neutral-300 hover:text-white transition-all cursor-pointer"
                            title="View Profile Details"
                          >
                            <Activity className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="p-1.5 rounded-lg border border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.05] text-neutral-300 hover:text-red-400 transition-all cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
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
export default AdminUsersPage;
