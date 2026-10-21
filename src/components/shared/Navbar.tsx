"use client";

import Link from "next/link";
import { Building2 } from "lucide-react";

export default function Navbar() {
  return (
    <nav
      className="sticky top-0 z-50 glass-card border-b border-[var(--border-color)] px-4 sm:px-6 lg:px-8"
      role="navigation"
      aria-label="Main navigation"
    >
      <div className="mx-auto max-w-7xl flex items-center justify-between h-16">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-2.5 group"
          aria-label="IQOL Home"
        >
          <div className="w-9 h-9 rounded-lg bg-[var(--gradient-brand)] flex items-center justify-center transition-transform duration-200 group-hover:scale-105">
            <Building2 className="w-5 h-5 text-white" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight leading-none">
              IQOL
            </span>
            <span className="text-[0.625rem] font-medium text-[var(--foreground-subtle)] leading-none tracking-widest uppercase">
              Demo
            </span>
          </div>
        </Link>

        {/* Demo notice */}
        <div className="hidden sm:flex items-center gap-2">
          <span className="badge badge-warning text-xs">
            Demonstration Only
          </span>
        </div>
      </div>
    </nav>
  );
}
