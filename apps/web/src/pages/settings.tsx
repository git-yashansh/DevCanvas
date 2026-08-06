import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Sliders,
  CreditCard,
  Lock,
  LogOut,
  ShieldAlert,
  Check,
  CheckCircle2,
  Activity,
  Calendar,
  Mail,
  UserCheck,
  Clock
} from "lucide-react";
import { PageHeader } from "@/components/dashboard/page-header";
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Separator,
  Label
} from "@ui/index";
import { useAuth } from "@/lib/auth-context";
import { initials } from "@utils/index";
import { useProjects } from "@/lib/queries/projects";

type SettingsTab = "account" | "preferences" | "billing" | "security";

export function SettingsPage() {
  const { user, profile, loading, error, signOut } = useAuth();
  const navigate = useNavigate();

  // Fetch real workspace projects
  const { data: projects } = useProjects();

  const projectsCount = projects?.length || 0;
  const projectLimit = profile?.role === "admin" ? 100 : 5;
  const projectsRemaining = Math.max(0, projectLimit - projectsCount);
  const projectsPercent = Math.min(100, Math.round((projectsCount / projectLimit) * 100));

  const artifactsCount = projects
    ? projects.reduce((acc, project: any) => {
        const hasArch = Boolean(project.architecture);
        const hasDb = Boolean(project.database_schema);
        const hasApi = Boolean(project.api_spec);
        const hasSec = Boolean(project.security_report);
        const hasDoc = Boolean(project.documentation);
        const hasDeploy = Boolean(project.deployment_plan);
        return acc + [hasArch, hasDb, hasApi, hasSec, hasDoc, hasDeploy].filter(Boolean).length;
      }, 0)
    : 0;
  const artifactLimit = profile?.role === "admin" ? 500 : 20;
  const artifactsRemaining = Math.max(0, artifactLimit - artifactsCount);
  const artifactsPercent = Math.min(100, Math.round((artifactsCount / artifactLimit) * 100));

  const securityCount = projects
    ? projects.filter((project: any) => Boolean(project.security_report)).length
    : 0;
  const securityLimit = profile?.role === "admin" ? 100 : 5;
  const securityRemaining = Math.max(0, securityLimit - securityCount);
  const securityPercent = Math.min(100, Math.round((securityCount / securityLimit) * 100));

  // Active Tab State
  const [activeTab, setActiveTab] = useState<SettingsTab>("account");

  // Developer Preferences States (Local-first persistence)
  const [dbDialect, setDbDialect] = useState("postgres");
  const [apiFormat, setApiFormat] = useState("rest");
  const [archStyle, setArchStyle] = useState("microservices");
  const [deployTarget, setDeployTarget] = useState("aws");
  const [savedPreferences, setSavedPreferences] = useState(false);

  // Load preferences on mount
  useEffect(() => {
    setDbDialect(localStorage.getItem("devcanvas_db_dialect") || "postgres");
    setApiFormat(localStorage.getItem("devcanvas_api_format") || "rest");
    setArchStyle(localStorage.getItem("devcanvas_arch_style") || "microservices");
    setDeployTarget(localStorage.getItem("devcanvas_deploy_target") || "aws");
  }, []);

  // Handle saving Developer Preferences
  function handleSavePreferences() {
    localStorage.setItem("devcanvas_db_dialect", dbDialect);
    localStorage.setItem("devcanvas_api_format", apiFormat);
    localStorage.setItem("devcanvas_arch_style", archStyle);
    localStorage.setItem("devcanvas_deploy_target", deployTarget);
    setSavedPreferences(true);
    setTimeout(() => setSavedPreferences(false), 3000);
  }

  // Format Member Since Date
  const memberSince = profile?.created_at || user?.created_at
    ? new Date(profile?.created_at || user?.created_at || "").toLocaleDateString("en-US", {
        year: "numeric",
        month: "long"
      })
    : "N/A";

  // Format Last Sign In Date
  const formatLastSignIn = (dateStr?: string) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    const timeStr = date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true
    });

    if (isToday) {
      return `Today ${timeStr}`;
    }

    return `${date.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric"
    })}, ${timeStr}`;
  };

  // Sidebar Menu Items
  const sidebarItems = [
    { id: "account", label: "Profile & Account", icon: User },
    { id: "preferences", label: "Developer Preferences", icon: Sliders },
    { id: "billing", label: "Plan & Usage Limits", icon: CreditCard },
    { id: "security", label: "Session & Security", icon: Lock }
  ] as const;

  // Render Loading Skeleton State
  if (loading) {
    return (
      <div className="w-full px-5 py-6 lg:px-8 animate-pulse">
        <div className="h-9 w-40 bg-white/5 rounded-lg mb-2" />
        <div className="h-4 w-80 bg-white/5 rounded-lg mb-8" />
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          <div className="lg:col-span-1">
            <div className="h-[220px] bg-[#0b0b0b] border border-white/10 rounded-xl" />
          </div>
          <div className="lg:col-span-3">
            <div className="h-[440px] bg-[#0b0b0b] border border-white/10 rounded-xl" />
          </div>
        </div>
      </div>
    );
  }

  // Render Error Card State
  if (error) {
    return (
      <div className="w-full px-5 py-6 lg:px-8">
        <PageHeader title="Settings" description="Manage your DevCanvas environment." />
        <Card className="mt-8 border border-white/10 bg-[#0b0b0b] backdrop-blur-md shadow-lg">
          <CardContent className="pt-8 flex flex-col items-center justify-center text-center p-8 space-y-4">
            <ShieldAlert className="h-12 w-12 text-danger-400" />
            <h3 className="text-lg font-semibold text-white">Error Loading Profile</h3>
            <p className="text-sm text-neutral-400 max-w-md">{error}</p>
            <Button variant="outline" onClick={() => window.location.reload()} className="border-white/10 hover:border-white/20 text-neutral-200">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full px-5 py-6 lg:px-8">
      <PageHeader
        title="Settings"
        description="Manage your DevCanvas environment, developer defaults, connected keys, and account preferences."
      />

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-4">
        {/* Sidebar tabs (Navigation) */}
        <div className="lg:col-span-1">
          <Card className="border border-white/10 bg-[#0b0b0b] backdrop-blur-md shadow-lg p-2">
            <div className="flex flex-row overflow-x-auto gap-1 pb-2 lg:pb-0 lg:flex-col lg:overflow-x-visible">
              {sidebarItems.map((item) => {
                const IsActive = activeTab === item.id;
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`flex items-center gap-3 shrink-0 rounded-xl px-4 py-3 text-sm font-medium transition-all duration-300 ${
                      IsActive
                        ? "bg-white/10 text-white border border-white/10 shadow-md"
                        : "text-neutral-400 hover:bg-white/5 hover:text-neutral-200 border border-transparent"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Form Content Area */}
        <div className="lg:col-span-3 min-h-[480px]">
          <AnimatePresence mode="wait">
            {activeTab === "account" && (
              <motion.div
                key="account"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <Card className="border border-white/10 bg-[#0b0b0b] backdrop-blur-md shadow-lg relative overflow-hidden">
                  <CardHeader className="border-b border-white/5 pb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-5 justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-20 w-20 border-2 border-white/10">
                          {profile?.avatar_url ? (
                            <AvatarImage src={profile.avatar_url} />
                          ) : null}
                          <AvatarFallback className="bg-white/5 text-neutral-200 text-2xl font-bold">
                            {initials(profile?.full_name || user?.email || "User")}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-2xl font-bold text-white tracking-tight">
                            {profile?.full_name || user?.email?.split("@")[0] || "Developer"}
                          </CardTitle>
                          <p className="mt-1 text-sm text-neutral-400">{user?.email}</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 items-center">
                        <Badge variant="outline" className="bg-white/5 border-white/15 text-neutral-300 capitalize flex gap-1.5 items-center px-3 py-1">
                          <span className="h-1.5 w-1.5 rounded-full bg-neutral-400" />
                          {profile?.role || "User"}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 relative">
                    {/* Read-Only Grid of Premium Information Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-24">
                      <div className="space-y-1 p-4 rounded-xl border border-white/5 bg-[#121212]/30">
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                          <User className="h-3.5 w-3.5" />
                          <span>Username</span>
                        </div>
                        <p className="text-base text-neutral-200 font-medium">
                          {profile?.full_name || user?.email?.split("@")[0] || "N/A"}
                        </p>
                      </div>

                      <div className="space-y-1 p-4 rounded-xl border border-white/5 bg-[#121212]/30">
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                          <Mail className="h-3.5 w-3.5" />
                          <span>Email</span>
                        </div>
                        <p className="text-base text-neutral-200 font-medium break-all">
                          {user?.email || "N/A"}
                        </p>
                      </div>

                      <div className="space-y-1 p-4 rounded-xl border border-white/5 bg-[#121212]/30">
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                          <UserCheck className="h-3.5 w-3.5" />
                          <span>Role</span>
                        </div>
                        <p className="text-base text-neutral-200 font-medium capitalize">
                          {profile?.role || "User"}
                        </p>
                      </div>

                      <div className="space-y-1 p-4 rounded-xl border border-white/5 bg-[#121212]/30">
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>Member Since</span>
                        </div>
                        <p className="text-base text-neutral-200 font-medium">
                          {memberSince}
                        </p>
                      </div>

                      <div className="space-y-1 p-4 rounded-xl border border-white/5 bg-[#121212]/30 md:col-span-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-neutral-500 uppercase tracking-widest">
                          <Clock className="h-3.5 w-3.5" />
                          <span>Last Login</span>
                        </div>
                        <p className="text-base text-neutral-200 font-medium">
                          {formatLastSignIn(user?.last_sign_in_at)}
                        </p>
                      </div>
                    </div>

                    {/* Premium Logout Button placed at bottom-right of the card */}
                    <div className="absolute bottom-6 right-6">
                      <Button
                        onClick={async () => {
                          await signOut();
                          navigate("/");
                        }}
                        className="bg-transparent border border-white/20 hover:border-orange-500 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 transition-all duration-300 text-neutral-300 px-5 py-2 font-medium rounded-xl flex items-center gap-2"
                      >
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "preferences" && (
              <motion.div
                key="preferences"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
              >
                <Card className="border border-white/10 bg-[#0b0b0b] backdrop-blur-md shadow-lg">
                  <CardHeader className="border-b border-white/5 pb-6">
                    <CardTitle className="text-xl font-semibold text-white">Developer Preferences</CardTitle>
                    <p className="text-sm text-neutral-400 mt-1">
                      Configure your default workspace preferences for database generation, APIs, and microservices architecture blueprints.
                    </p>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                      <div className="space-y-2.5">
                        <Label htmlFor="dbDialect" className="text-neutral-300">Default Database Dialect</Label>
                        <select
                          id="dbDialect"
                          value={dbDialect}
                          onChange={(e) => setDbDialect(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-primary-500/50 focus:outline-none"
                        >
                          <option value="postgres">PostgreSQL (Recommended)</option>
                          <option value="mysql">MySQL</option>
                          <option value="sqlite">SQLite</option>
                          <option value="mongodb">MongoDB (NoSQL)</option>
                        </select>
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="apiFormat" className="text-neutral-300">Preferred API Specification</Label>
                        <select
                          id="apiFormat"
                          value={apiFormat}
                          onChange={(e) => setApiFormat(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-primary-500/50 focus:outline-none"
                        >
                          <option value="rest">REST API (OpenAPI 3.0)</option>
                          <option value="graphql">GraphQL (Queries & Schema)</option>
                          <option value="grpc">gRPC (Protocol Buffers)</option>
                        </select>
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="archStyle" className="text-neutral-300">Default Architecture Style</Label>
                        <select
                          id="archStyle"
                          value={archStyle}
                          onChange={(e) => setArchStyle(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-primary-500/50 focus:outline-none"
                        >
                          <option value="microservices">Microservices (Decoupled)</option>
                          <option value="monolith">Modular Monolith</option>
                          <option value="serverless">Serverless Architecture</option>
                        </select>
                      </div>

                      <div className="space-y-2.5">
                        <Label htmlFor="deployTarget" className="text-neutral-300">Default Deployment Blueprint</Label>
                        <select
                          id="deployTarget"
                          value={deployTarget}
                          onChange={(e) => setDeployTarget(e.target.value)}
                          className="w-full rounded-lg border border-white/10 bg-surface px-3 py-2 text-sm text-white focus:border-primary-500/50 focus:outline-none"
                        >
                          <option value="aws">AWS (ECS / RDS)</option>
                          <option value="vercel">Vercel (Serverless Functions)</option>
                          <option value="supabase">Supabase (PostgreSQL & Edge Functions)</option>
                          <option value="docker">Docker Compose (Self-Hosted)</option>
                        </select>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-6">
                      <p className="text-xs text-neutral-500">
                        Preferences will apply dynamically as default selections for new blueprint generation runs.
                      </p>
                      <Button variant="gradient" onClick={handleSavePreferences}>
                        {savedPreferences ? (
                          <><Check className="h-4 w-4 mr-2" />Preferences Saved</>
                        ) : (
                          "Save Preferences"
                        )}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* API Integrations tab content removed by user request */}

            {activeTab === "billing" && (
              <motion.div
                key="billing"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Current plan detail card */}
                <Card className="border border-white/10 bg-[#0b0b0b] backdrop-blur-md shadow-lg">
                  <CardHeader className="border-b border-white/5 pb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl font-semibold text-white">Plan & Usage Limits</CardTitle>
                        <p className="text-sm text-neutral-400 mt-1">
                          Review your subscription quotas and track resources consumed in this billing cycle.
                        </p>
                      </div>
                      <Badge variant="accent" className="px-4 py-1.5 text-xs font-semibold uppercase tracking-wider">
                        {profile?.role === "admin" ? "Team / Enterprise" : "Hobby Free"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    {/* Usage Progress bars */}
                    <div className="space-y-5">
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-neutral-200">Projects Quota</span>
                          <span className="text-neutral-400">
                            {projectsCount} / {projectLimit} projects ({projectsRemaining} remaining){" "}
                            <span className="text-xs text-primary-400">({projectsPercent}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" style={{ width: `${projectsPercent}%` }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-neutral-200">Generated Engineering Artifacts</span>
                          <span className="text-neutral-400">
                            {artifactsCount} / {artifactLimit} artifacts ({artifactsRemaining} remaining){" "}
                            <span className="text-xs text-primary-400">({artifactsPercent}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" style={{ width: `${artifactsPercent}%` }} />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium text-neutral-200">Security Scans & Threat Models</span>
                          <span className="text-neutral-400">
                            {securityCount} / {securityLimit} scans ({securityRemaining} remaining){" "}
                            <span className="text-xs text-primary-400">({securityPercent}%)</span>
                          </span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-white/5 overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" style={{ width: `${securityPercent}%` }} />
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border border-white/10 bg-[#121212]/50 rounded-xl p-4 mt-6">
                      <div className="flex items-center gap-3">
                        <Activity className="h-5 w-5 text-neutral-400" />
                        <div>
                          <p className="text-sm font-medium text-white">Need higher quotas?</p>
                          <p className="text-xs text-neutral-400 font-normal">Upgrade to Pro/Team plan for infinite generations, priority queue, and SSO.</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => navigate("/")} className="shrink-0 border-white/10 hover:border-white/20 text-neutral-200">
                        View Pricing Plans
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                key="security"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Danger zone actions */}
                <Card className="border border-white/10 bg-[#0b0b0b] backdrop-blur-md shadow-lg">
                  <CardHeader className="border-b border-white/5 pb-6">
                    <CardTitle className="text-xl font-semibold text-white">Security & Active Sessions</CardTitle>
                    <p className="text-sm text-neutral-400 mt-1">
                      Manage authentication sessions, login status, and perform general danger zone actions.
                    </p>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-6">
                    <div className="rounded-xl border border-white/10 bg-[#121212]/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-white border border-white/10">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Current Active Session</p>
                          <p className="text-xs text-neutral-400">Authenticated via email login</p>
                        </div>
                      </div>
                      <Button variant="outline" className="border-white/10 hover:border-orange-500 hover:text-orange-400 hover:shadow-[0_0_15px_rgba(249,115,22,0.25)] hover:-translate-y-0.5 transition-all duration-300 text-neutral-200" onClick={async () => { await signOut(); navigate("/"); }}>
                        Sign Out Session
                      </Button>
                    </div>

                    <div className="rounded-xl border border-white/10 bg-[#121212]/50 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mt-6">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/5 text-neutral-400 border border-white/10">
                          <ShieldAlert className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Danger Zone: Delete Account</p>
                          <p className="text-xs text-neutral-400">Permanently delete your profile workspace and all generated schemas, diagrams, and projects.</p>
                        </div>
                      </div>
                      <Button variant="danger" className="bg-[#0b0b0b] border border-white/20 hover:border-danger-500 hover:text-danger-400 transition-colors text-white">
                        Delete Account
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
