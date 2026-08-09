import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin } from "lucide-react";
import { site } from "@config/index";
import logoImg from "../../logo.png";

const columns = [
  {
    title: "Product",
    links: [
      { label: "Features", href: "#features" },
      { label: "How it works", href: "#how-it-works" },
      { label: "Security", href: "#features" },
      { label: "Pricing", href: "#pricing" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About", href: "#features" },
      { label: "Blog", href: "#features" },
      { label: "Careers", href: "#features" },
      { label: "Contact", href: "mailto:support@devcanvas.com" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Documentation", href: "#faq" },
      { label: "API reference", href: "#features" },
      { label: "Changelog", href: "#faq" },
      { label: "Status", href: "#faq" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "#faq" },
      { label: "Terms", href: "#faq" },
      { label: "Security", href: "#faq" },
      { label: "DPA", href: "#faq" },
    ],
  },
];

const socials = [
  { icon: Github, href: "https://github.com", label: "GitHub" },
  { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
  { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-white/8">
      {/* Top glow */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent" />

      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-6">
          <div className="col-span-2">
            <Link to="/" className="flex items-center gap-2.5 group">
              <img
                src={logoImg}
                alt="DevCanvas"
                className="h-19 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
              />
              {/* <span className="font-heading text-lg font-semibold text-white">{site.name}</span> */}
            </Link>
            <p className="mt-4 max-w-xs text-sm text-white/35">
              {site.tagline}. The AI engineering platform for teams that ship.
            </p>
            <div className="mt-6 flex gap-3">
              {socials.map((social) => (
                <a key={social.label} href={social.href} aria-label={social.label}
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/40 transition-colors hover:border-white/20 hover:text-white/80">
                  <social.icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>
          {columns.map((column) => (
            <div key={column.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-white/30">
                {column.title}
              </h4>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <a href={link.href}
                      className="text-sm text-white/40 transition-colors hover:text-white/80">
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-white/8 pt-8 sm:flex-row">
          <p className="text-xs text-white/25">
            © {new Date().getFullYear()} {site.name}, Inc. All rights reserved.
          </p>
          <p className="text-xs text-white/25">Powered by Nexora Technologies.</p>
        </div>
      </div>
    </footer>
  );
}
