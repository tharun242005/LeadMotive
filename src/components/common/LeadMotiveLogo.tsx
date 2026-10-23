"use client";

import React from "react";

interface LogoProps {
  className?: string;
  iconOnly?: boolean;
  size?: "sm" | "md" | "lg";
}

export function LeadMotiveLogo({ className = "", iconOnly = false, size = "md" }: LogoProps) {
  const iconSizes = {
    sm: "w-6 h-6",
    md: "w-8 h-8",
    lg: "w-10 h-10",
  };

  const textSizes = {
    sm: "text-base",
    md: "text-lg",
    lg: "text-2xl",
  };

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Stylized M Icon Ribbon */}
      <div
        className={`${iconSizes[size]} rounded-xl flex items-center justify-center shrink-0 shadow-xs transition-transform group-hover:scale-105`}
        style={{
          background: "linear-gradient(135deg, var(--lm-brand) 0%, var(--lm-accent) 100%)",
        }}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-4/5 h-4/5"
        >
          {/* Stylized geometric M with dynamic ribbons */}
          <path
            d="M4 18V8.5C4 6.57 5.57 5 7.5 5C8.8 5 9.94 5.71 10.53 6.78L12 9.5L13.47 6.78C14.06 5.71 15.2 5 16.5 5C18.43 5 20 6.57 20 8.5V18"
            stroke="var(--lm-canvas)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M9 13.5L12 18.5L15 13.5"
            stroke="var(--lm-canvas)"
            strokeWidth="2.75"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {!iconOnly && (
        <div className="flex flex-col leading-none">
          <span
            className={`font-bold tracking-tight text-ink font-sans ${textSizes[size]}`}
          >
            Lead<span className="text-brand">Motive</span>
          </span>
          <span className="text-[10px] text-subtle font-medium tracking-wider uppercase mt-0.5">
            Real Estate AI
          </span>
        </div>
      )}
    </div>
  );
}
