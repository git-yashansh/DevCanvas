import { useState, useEffect } from "react";
import { Save, Cpu, Mail, Lock, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";

export function AdminSettingsPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Settings values
  const [supportEmail, setSupportEmail] = useState("support@devcanvas.ai");
  const [smtpServer, setSmtpServer] = useState("smtp.sendgrid.net");
  const [rateLimit, setRateLimit] = useState(60);
  const [geminiKey, setGeminiKey] = useState("••••••••••••••••••••••••");

  const [flags, setFlags] = useState<Record<string, boolean>>({
    enableRegistration: true,
    enableAiDiagnostics: true,
  });

  async function loadSettings() {
    setLoading(true);
    try {
      // 1. Fetch feature flags
      const { data: flagData } = await supabase.from("feature_flags").select("*");
      if (flagData) {
        const flagMap: Record<string, boolean> = {};
        flagData.forEach((f) => {
          flagMap[f.key] = f.value;
        });
        setFlags((prev) => ({ ...prev, ...flagMap }));
      }

      // 2. Fetch admin settings
      const { data: settingData } = await supabase.from("admin_settings").select("*");
      if (settingData) {
        settingData.forEach((s) => {
          if (s.key === "support_email") setSupportEmail(s.value?.val || "");
          if (s.key === "smtp_server") setSmtpServer(s.value?.val || "");
          if (s.key === "rate_limit") setRateLimit(s.value?.val || 60);
          if (s.key === "gemini_key") setGeminiKey(s.value?.val || "");
        });
      }
    } catch (err) {
      console.error("Failed to load settings:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      // 1. Save feature flags
      for (const [key, value] of Object.entries(flags)) {
        await supabase.from("feature_flags").upsert({
          key,
          value,
          description: `System flag for ${key}`,
        });
      }

      // 2. Save settings
      const settingsList = [
        { key: "support_email", value: { val: supportEmail } },
        { key: "smtp_server", value: { val: smtpServer } },
        { key: "rate_limit", value: { val: rateLimit } },
        { key: "gemini_key", value: { val: geminiKey } },
      ];

      for (const item of settingsList) {
        await supabase.from("admin_settings").upsert({
          key: item.key,
          value: item.value,
        });
      }

      // Log admin audit action
      await supabase.from("audit_logs").insert({
        actor_id: user.id,
        action: "Updated SaaS Settings",
        entity: "admin_settings & feature_flags",
        result: "success",
      });

      alert("Operational settings updated successfully.");
    } catch (err) {
      console.error("Failed to save settings:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleFlagToggle = (key: string, checked: boolean) => {
    setFlags((prev) => ({ ...prev, [key]: checked }));
  };

  return (
    <div className="p-6 lg:p-10 space-y-8 text-left max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b border-white/[0.08] pb-5">
        <h1 className="font-heading text-2xl font-black text-white tracking-wide">
          SaaS Operational Settings
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          Adjust global feature flags, change machine API access credentials, configure SMTP accounts, and modify rate controls.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
          <span className="text-xs text-neutral-500 font-mono">Loading configuration settings...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 text-xs text-left">
          
          {/* Toggle Feature Flags */}
          <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
              System Feature Flags
            </span>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="font-semibold text-white text-[13px]">User Self-Registration</p>
                  <p className="text-neutral-450 text-[11px]">Permit new email signup registrations on the landing page.</p>
                </div>
                <input
                  type="checkbox"
                  checked={flags.enableRegistration}
                  onChange={(e) => handleFlagToggle("enableRegistration", e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-neutral-900 text-orange-500 accent-orange-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between border-t border-white/[0.02] pt-4">
                <div className="space-y-1">
                  <p className="font-semibold text-white text-[13px]">AI Prompt Generation Engines</p>
                  <p className="text-neutral-450 text-[11px]">Permit prompt dispatches and schemas compilation tasks.</p>
                </div>
                <input
                  type="checkbox"
                  checked={flags.enableAiDiagnostics}
                  onChange={(e) => handleFlagToggle("enableAiDiagnostics", e.target.checked)}
                  className="h-4 w-4 rounded border-white/10 bg-neutral-900 text-orange-500 accent-orange-500 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Configurations Forms */}
          <div className="bg-[#0B0C0E]/40 border border-white/[0.06] rounded-2xl p-5 space-y-4">
            <span className="font-heading text-[15px] font-bold text-white block border-b border-white/[0.08] pb-3">
              API Keys & SMTP Credentials
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-orange-400" /> Operational Support Email</label>
                <input
                  type="email"
                  value={supportEmail}
                  onChange={(e) => setSupportEmail(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-orange-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold flex items-center gap-1.5"><Mail className="h-3.5 w-3.5 text-indigo-400" /> SendGrid SMTP Server</label>
                <input
                  type="text"
                  value={smtpServer}
                  onChange={(e) => setSmtpServer(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-orange-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold flex items-center gap-1.5"><Cpu className="h-3.5 w-3.5 text-emerald-400" /> Gemini Pro API Secret Token Key</label>
                <input
                  type="text"
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-orange-500/50"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-neutral-400 font-semibold flex items-center gap-1.5"><Lock className="h-3.5 w-3.5 text-cyan-400" /> Rate Limits (Requests/min)</label>
                <input
                  type="number"
                  value={rateLimit}
                  onChange={(e) => setRateLimit(Number(e.target.value))}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 text-xs text-white placeholder:text-neutral-500 outline-none focus:border-orange-500/50"
                />
              </div>
            </div>
          </div>

          {/* Submit Actions */}
          <button
            type="submit"
            disabled={saving}
            className="h-10 px-6 bg-orange-500 hover:bg-orange-600 text-white font-heading font-bold rounded-xl transition-all cursor-pointer flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Save System Configurations
          </button>

        </form>
      )}
    </div>
  );
}
export default AdminSettingsPage;
