export const colors = {
  background: "#09090B",
  surface: "#111827",
  surface2: "#0F172A",
  border: "#27272A",
  borderHover: "#3F3F46",
  primary: "#3B82F6",
  secondary: "#8B5CF6",
  accent: "#06B6D4",
  success: "#22C55E",
  warning: "#F59E0B",
  danger: "#EF4444",
} as const;

export const fonts = {
  heading: "Space Grotesk",
  body: "Inter",
  mono: "JetBrains Mono",
} as const;

export const site = {
  name: "DevCanvas",
  tagline: "Design. Build. Secure. Scale.",
  description:
    "DevCanvas is an AI Engineering Platform that transforms natural language requirements into production-ready software engineering assets.",
  url: "https://devcanvas.app",
  author: "DevCanvas, Inc.",
  keywords: [
    "AI engineering platform",
    "software architecture generator",
    "database schema designer",
    "API generator",
    "security analysis",
    "system design",
    "code generation",
    "DevOps",
  ],
} as const;

export const navLinks = [
  { label: "Features", href: "/#features" },
  { label: "Architecture", href: "/#architecture" },
  { label: "Security", href: "/#security" },
  { label: "Pricing", href: "/#pricing" },
  { label: "Docs", href: "/#faq" },
] as const;

export const socialLinks = [
  { label: "GitHub", href: "https://github.com", icon: "github" },
  { label: "Twitter", href: "https://twitter.com", icon: "twitter" },
  { label: "LinkedIn", href: "https://linkedin.com", icon: "linkedin" },
  { label: "Discord", href: "https://discord.com", icon: "discord" },
] as const;
