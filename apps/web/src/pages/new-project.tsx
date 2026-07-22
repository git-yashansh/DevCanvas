import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import {
  Loader2,
  AlertCircle,
  ArrowLeft,
  Sparkles,
  Boxes,
  Database,
  Code2,
  ShieldCheck,
  Zap,
  Globe,
  Lock,
  Tag,
  Layers,
  CheckCircle2,
} from "lucide-react";
import { Button, Input, Label, Badge } from "@ui/index";
import { useCreateProject } from "@/lib/queries/projects";
import { slugify, cn } from "@utils/index";

const schema = z.object({
  name: z.string().min(2, "Project name must be at least 2 characters."),
  description: z.string().max(1000, "Keep description under 1000 characters.").optional(),
  tags: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

const PRESET_TEMPLATES = [
  {
    title: "E-Commerce SaaS",
    description: "A multi-tenant e-commerce platform with Stripe billing, inventory management, user auth, and order tracking.",
    tags: "ecommerce, stripe, saas",
  },
  {
    title: "AI Chat & Analytics Platform",
    description: "An AI-powered workspace with LLM chat agents, real-time analytics streaming, vector database, and team RBAC.",
    tags: "ai, llm, analytics",
  },
  {
    title: "Fintech Banking API",
    description: "High-throughput banking backend microservice with transaction ledger, Webhooks, KYC verification, and Redis caching.",
    tags: "fintech, banking, security",
  },
  {
    title: "Social Media Platform",
    description: "Real-time social networking app with live feeds, media uploads, geolocation tagging, and WebSocket notifications.",
    tags: "social, media, realtime",
  },
];

export function NewProjectPage() {
  const navigate = useNavigate();
  const createProject = useCreateProject();
  const [serverError, setServerError] = useState<string | null>(null);
  const [visibility, setVisibility] = useState<"private" | "public">("private");

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      tags: "",
    },
  });

  const nameValue = watch("name") ?? "";
  const descriptionValue = watch("description") ?? "";
  const tagsValue = watch("tags") ?? "";

  const parsedTags = tagsValue
    ? tagsValue.split(",").map((t) => t.trim()).filter(Boolean)
    : [];

  const handleApplyPreset = (preset: (typeof PRESET_TEMPLATES)[0]) => {
    setValue("name", preset.title, { shouldValidate: true });
    setValue("description", preset.description, { shouldValidate: true });
    setValue("tags", preset.tags, { shouldValidate: true });
  };

  async function onSubmit(values: FormValues) {
    setServerError(null);
    const tags = values.tags
      ? values.tags.split(",").map((t) => t.trim()).filter(Boolean)
      : [];
    try {
      const project = await createProject.mutateAsync({
        name: values.name,
        description: values.description,
        tags,
      });
      navigate(`/app/projects/${project.id}`);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Failed to create project.");
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* ── Top Bar / Back Navigation ─────────────────────────── */}
      <div className="mb-6 flex items-center justify-between">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs font-medium text-white/60 transition-colors hover:border-white/20 hover:bg-white/[0.08] hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to workspace
        </button>

        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-indigo-500/30 text-indigo-300">
            <Sparkles className="mr-1 h-3 w-3" /> AI Studio Ready
          </Badge>
        </div>
      </div>

      {/* ── Headline ────────────────────────────────────────── */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-white sm:text-4xl">
          Create New AI Workspace
        </h1>
        <p className="mt-2 text-sm text-white/50">
          Define your project requirements below. DevCanvas will set up your workspace and prepare architecture, database, API specs, and security blueprints automatically.
        </p>
      </div>

      {/* ── Full Screen 2-Column Grid Layout ──────────────────── */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
        {/* Left Column: Form & Starter Templates (7 Cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Quick Preset Starters */}
          <div className="glass-card rounded-2xl p-5 bg-noise">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                <Zap className="h-3.5 w-3.5 text-indigo-400" /> Starter Preset Templates
              </span>
              <span className="text-[11px] text-white/30">Click to auto-fill</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PRESET_TEMPLATES.map((preset) => (
                <button
                  key={preset.title}
                  type="button"
                  onClick={() => handleApplyPreset(preset)}
                  className="group flex flex-col items-start text-left rounded-xl border border-white/8 bg-white/[0.02] p-3 transition-all hover:border-indigo-500/40 hover:bg-white/[0.06]"
                >
                  <span className="text-xs font-semibold text-white/80 group-hover:text-indigo-300 transition-colors">
                    {preset.title}
                  </span>
                  <span className="mt-1 line-clamp-2 text-[11px] text-white/40">
                    {preset.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Form */}
          <div className="glass-card rounded-2xl p-6 bg-noise">
            {serverError ? (
              <div className="mb-5 flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                <AlertCircle className="h-4 w-4 shrink-0" />
                {serverError}
              </div>
            ) : null}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Project Name
                </Label>
                <Input
                  id="name"
                  placeholder="e.g. My SaaS Platform"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:bg-white/[0.06]"
                  {...register("name")}
                />
                {errors.name ? (
                  <p className="text-xs text-red-400">{errors.name.message}</p>
                ) : (
                  <p className="text-xs text-white/40">
                    Slug ID: <span className="font-mono text-indigo-300">{slugify(nameValue) || "my-saas-platform"}</span>
                  </p>
                )}
              </div>

              {/* Description Prompt Input */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="description" className="text-xs font-semibold uppercase tracking-wider text-white/60">
                    Project Prompt & Description
                  </Label>
                  <span className="text-[11px] text-white/30">AI prompt input</span>
                </div>
                <textarea
                  id="description"
                  rows={5}
                  placeholder="Describe your application requirements in detail... e.g. A multi-tenant platform with Stripe billing, real-time webhooks, user RBAC, and Redis caching."
                  {...register("description")}
                  className="flex w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-sm text-white shadow-sm transition-all placeholder:text-white/20 focus:border-indigo-500/50 focus:bg-white/[0.06] focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                {errors.description ? (
                  <p className="text-xs text-red-400">{errors.description.message}</p>
                ) : null}
              </div>

              {/* Tags Input */}
              <div className="space-y-2">
                <Label htmlFor="tags" className="text-xs font-semibold uppercase tracking-wider text-white/60 flex items-center gap-1.5">
                  <Tag className="h-3.5 w-3.5" /> Workspace Tags
                </Label>
                <Input
                  id="tags"
                  placeholder="saas, billing, realtime, postgres"
                  className="h-11 rounded-xl border-white/10 bg-white/[0.03] text-white placeholder:text-white/20 focus:border-indigo-500/50 focus:bg-white/[0.06]"
                  {...register("tags")}
                />
                <p className="text-xs text-white/40">Comma-separated tags to organize your build.</p>
              </div>

              {/* Visibility Options */}
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-white/60">
                  Workspace Visibility
                </Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setVisibility("private")}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      visibility === "private"
                        ? "border-indigo-500/50 bg-indigo-500/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.05]"
                    )}
                  >
                    <Lock className="h-4 w-4 text-indigo-400" />
                    <div>
                      <p className="text-xs font-semibold">Private</p>
                      <p className="text-[10px] text-white/40">Only team members</p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setVisibility("public")}
                    className={cn(
                      "flex items-center gap-3 rounded-xl border p-3 text-left transition-all",
                      visibility === "public"
                        ? "border-indigo-500/50 bg-indigo-500/10 text-white"
                        : "border-white/10 bg-white/[0.02] text-white/50 hover:bg-white/[0.05]"
                    )}
                  >
                    <Globe className="h-4 w-4 text-emerald-400" />
                    <div>
                      <p className="text-xs font-semibold">Public</p>
                      <p className="text-[10px] text-white/40">Sharable link view</p>
                    </div>
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex items-center gap-3">
                <Button
                  type="submit"
                  variant="gradient"
                  size="lg"
                  className="sheen-btn flex-1 h-12 rounded-xl text-base font-semibold shadow-lg shadow-indigo-500/25"
                  disabled={createProject.isPending}
                >
                  {createProject.isPending ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Initializing Workspace…
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-5 w-5" />
                      Create AI Project Workspace
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => navigate(-1)}
                  className="h-12 rounded-xl border-white/10 hover:bg-white/10"
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Column: Live Interactive Workspace Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="sticky top-20">
            <span className="text-xs font-semibold uppercase tracking-wider text-white/40 mb-3 block flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-indigo-400" /> Live AI Workspace Preview
            </span>

            {/* Live Interactive Card Preview */}
            <div className="glass-card rounded-2xl p-6 bg-noise border border-white/15 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 h-32 w-32 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

              <div className="flex items-start justify-between border-b border-white/10 pb-4 mb-4">
                <div>
                  <h3 className="font-heading text-xl font-bold text-white tracking-tight">
                    {nameValue.trim() || "Untitled AI Workspace"}
                  </h3>
                  <p className="mt-1 text-xs text-white/40 font-mono">
                    /{slugify(nameValue) || "untitled-workspace"}
                  </p>
                </div>
                <Badge variant="success">Active</Badge>
              </div>

              {/* Description Preview */}
              <div className="space-y-2 mb-5">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  Prompt Summary
                </span>
                <p className="text-xs text-white/70 leading-relaxed line-clamp-4 bg-white/[0.03] p-3 rounded-xl border border-white/5">
                  {descriptionValue.trim() || "Enter your project description on the left or select a starter preset to see the live prompt..."}
                </p>
              </div>

              {/* Parsed Tags Preview */}
              {parsedTags.length > 0 ? (
                <div className="space-y-2 mb-6">
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                    Tags
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {parsedTags.map((tag) => (
                      <span
                        key={tag}
                        className="rounded-lg border border-white/10 bg-white/[0.06] px-2.5 py-0.5 text-xs text-indigo-300 font-medium"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              ) : null}

              {/* Prepared Blueprint Modules */}
              <div className="space-y-2 border-t border-white/10 pt-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-white/30">
                  Prepared AI Generators
                </span>
                <div className="grid grid-cols-2 gap-2 pt-1">
                  {[
                    { icon: Boxes, label: "Architecture", color: "text-indigo-400" },
                    { icon: Database, label: "Database ERD", color: "text-purple-400" },
                    { icon: Code2, label: "API Specification", color: "text-blue-400" },
                    { icon: ShieldCheck, label: "Security Report", color: "text-emerald-400" },
                  ].map(({ icon: Icon, label, color }) => (
                    <div
                      key={label}
                      className="flex items-center gap-2 rounded-xl border border-white/8 bg-white/[0.03] p-2.5 text-xs text-white/70"
                    >
                      <Icon className={`h-4 w-4 ${color}`} />
                      <span className="truncate">{label}</span>
                      <CheckCircle2 className="ml-auto h-3.5 w-3.5 text-emerald-400 opacity-80" />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
