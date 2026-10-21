"use client";

import { useState, type FormEvent } from "react";
import { Building2, Loader2, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function AdminLoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<"idle" | "submitting" | "error">(
    "idle"
  );
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("submitting");

    // Simulate auth check (Phase 3 will connect to Supabase)
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setStatus("error");
    setErrorMessage("Invalid email or password");
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-12" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8 animate-fade-up">
          <div className="w-14 h-14 rounded-xl bg-[var(--gradient-brand)] flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">IQOL Admin</h1>
          <p className="text-sm text-white/50 mt-1">
            Operations Dashboard Login
          </p>
        </div>

        {/* Login card */}
        <div className="card p-8 animate-fade-up" style={{ animationDelay: "100ms" }}>
          {status === "error" && (
            <div
              className="flex items-center gap-3 p-4 rounded-lg bg-[oklch(0.58_0.22_25_/_0.08)] border border-[oklch(0.58_0.22_25_/_0.2)] mb-6"
              role="alert"
            >
              <AlertCircle className="w-5 h-5 text-[oklch(0.48_0.18_25)] flex-shrink-0" />
              <p className="text-sm text-[oklch(0.48_0.18_25)]">
                {errorMessage}
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-5">
              {/* Email */}
              <div>
                <label
                  htmlFor="admin-email"
                  className="block text-sm font-medium mb-1.5"
                >
                  Email
                </label>
                <input
                  id="admin-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="input"
                  placeholder="admin@example.com"
                />
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="admin-password"
                  className="block text-sm font-medium mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="admin-password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
                    required
                    className="input pr-10"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--foreground-subtle)] hover:text-[var(--foreground-muted)] transition-colors"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={status === "submitting"}
              className="btn btn-primary btn-lg w-full mt-6"
              id="admin-login-submit"
            >
              {status === "submitting" ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <p className="text-xs text-[var(--foreground-subtle)] text-center mt-6">
            Demo — Single admin account. No self-registration.
          </p>
        </div>
      </div>
    </div>
  );
}
