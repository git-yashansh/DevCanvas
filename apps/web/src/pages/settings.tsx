import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Bell, Shield, Palette, LogOut, Check, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import { Button, Card, CardContent, CardHeader, CardTitle, Avatar, AvatarFallback, Input, Label } from "@ui/index";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { initials } from "@utils/index";

export function SettingsPage() {
  const { profile, refreshProfile, signOut } = useAuth();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState(profile?.full_name ?? "");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  async function handleSave() {
    if (!profile || !fullName.trim()) return;
    setSaving(true);
    setSaved(false);
    setSaveError(null);

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: fullName.trim() })
      .eq("id", profile.id);

    if (error) {
      setSaveError(error.message);
    } else {
      await refreshProfile();
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }
    setSaving(false);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <PageHeader title="Settings" description="Manage your DevCanvas account." />

      <div className="mt-8 space-y-6">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 border border-border">
                  <AvatarFallback className="bg-primary-500/10 text-primary-300 text-lg font-semibold">
                    {initials(fullName || profile?.full_name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{fullName || profile?.full_name || "User"}</CardTitle>
                  <p className="mt-1 text-sm text-neutral-400">{profile?.email}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full name</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" defaultValue={profile?.email ?? ""} disabled />
                </div>
              </div>
              {saveError ? (
                <p className="mt-2 text-xs text-danger-400">{saveError}</p>
              ) : null}
              <Button
                variant="gradient"
                className="mt-4"
                onClick={handleSave}
                disabled={saving || !fullName.trim() || fullName.trim() === profile?.full_name}
              >
                {saved ? (
                  <><Check className="h-4 w-4" />Saved</>
                ) : saving ? (
                  <><Loader2 className="h-4 w-4 animate-spin" />Saving…</>
                ) : (
                  "Save changes"
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {[
            { icon: Bell, title: "Notifications", description: "Email and in-app alerts" },
            { icon: Shield, title: "Security", description: "Password and sessions" },
            { icon: Palette, title: "Appearance", description: "Theme preferences" },
          ].map((section, i) => (
            <motion.div key={section.title} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.3 }}>
              <Card className="h-full opacity-60 cursor-not-allowed select-none">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface-2 text-primary-400">
                      <section.icon className="h-4 w-4" />
                    </span>
                    <div>
                      <CardTitle className="text-sm">{section.title}</CardTitle>
                      <p className="mt-0.5 text-xs text-neutral-400">{section.description}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="border-danger-500/30 bg-danger-500/5">
          <CardContent className="flex items-center justify-between pt-6">
            <div className="flex items-center gap-3">
              <LogOut className="h-5 w-5 text-danger-400" />
              <div>
                <p className="text-sm font-medium text-neutral-100">Sign out</p>
                <p className="text-xs text-neutral-400">End your current session</p>
              </div>
            </div>
            <Button variant="outline" onClick={async () => { await signOut(); navigate("/"); }}>
              Sign out
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
