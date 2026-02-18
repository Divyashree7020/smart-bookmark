"use client"

import { useState } from "react"
import { supabase } from "@/lib/supabaseClient"

export default function AuthPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function signInWithGoogle() {
    try {
      setError(null)
      setLoading(true)

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          // this must match your callback route
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) setError(error.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Background */}
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -top-24 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-blue-500/15 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(59,130,246,0.12),transparent_35%),radial-gradient(circle_at_80%_60%,rgba(16,185,129,0.10),transparent_35%)]" />
      </div>

      <div className="relative mx-auto flex min-h-screen max-w-6xl items-center justify-center px-4">
        <div className="grid w-full gap-8 lg:grid-cols-2">
          {/* Left: brand/benefits */}
          <div className="hidden lg:flex flex-col justify-center">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-300" />
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Smart Bookmark</h1>
                <p className="text-sm text-zinc-400">
                  Private bookmarks • Realtime sync • Supabase RLS
                </p>
              </div>
            </div>

            <div className="mt-10 space-y-4 text-sm text-zinc-300">
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
                <p className="font-medium text-zinc-100">🔒 Private by default</p>
                <p className="mt-1 text-zinc-400">
                  Row Level Security ensures each user only sees their own bookmarks.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
                <p className="font-medium text-zinc-100">⚡ Realtime updates</p>
                <p className="mt-1 text-zinc-400">
                  Open two tabs — changes appear instantly without refresh.
                </p>
              </div>
              <div className="rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4">
                <p className="font-medium text-zinc-100">✅ Google OAuth only</p>
                <p className="mt-1 text-zinc-400">
                  No passwords stored. Sign in securely with Google.
                </p>
              </div>
            </div>
          </div>

          {/* Right: login card */}
          <div className="flex items-center justify-center">
            <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900/40 p-7 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-300" />
                <div>
                  <h2 className="text-xl font-semibold">Sign in</h2>
                  <p className="text-sm text-zinc-400">
                    Use Google to access your private workspace.
                  </p>
                </div>
              </div>

              <button
                onClick={signInWithGoogle}
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-blue-600 px-4 py-3 text-sm font-semibold
                           hover:bg-blue-500 disabled:opacity-60 disabled:cursor-not-allowed
                           transition flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Connecting...
                  </>
                ) : (
                  "Continue with Google"
                )}
              </button>

              {error && (
                <p className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                  {error}
                </p>
              )}

              <div className="mt-6 flex items-center justify-between text-xs text-zinc-500">
                <span>Google OAuth only</span>
                <span>Secure session cookies</span>
              </div>

              <div className="mt-6 border-t border-zinc-800 pt-4 text-xs text-zinc-500">
                Built with Next.js (App Router), Supabase Auth/DB/Realtime, Tailwind CSS
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
