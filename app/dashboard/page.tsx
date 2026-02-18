"use client"

import { useEffect, useMemo, useState } from "react"
import { supabase } from "@/lib/supabaseClient"

type Bookmark = {
  id: string
  title: string
  url: string
  created_at: string
}

type Toast = { type: "success" | "error" | "info"; message: string } | null

function safeUrl(input: string) {
  const t = input.trim()
  if (!t) return ""
  if (t.startsWith("http://") || t.startsWith("https://")) return t
  return `https://${t}`
}

function getDomain(u: string) {
  try {
    return new URL(u).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

function isValidUrl(u: string) {
  try {
    new URL(u)
    return true
  } catch {
    return false
  }
}

export default function Dashboard() {
  const [email, setEmail] = useState<string | null>(null)

  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [query, setQuery] = useState("")

  const [bookmarks, setBookmarks] = useState<Bookmark[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState<Toast>(null)

  useEffect(() => {
    let channel: any

    async function init() {
      const { data } = await supabase.auth.getUser()

      if (!data.user) {
        window.location.href = "/auth"
        return
      }

      setEmail(data.user.email ?? null)

      await fetchBookmarks()

      // ✅ Realtime subscription (Tab 2 updates automatically)
      channel = supabase
        .channel(`bookmarks-realtime-${data.user.id}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "bookmarks",
            filter: `user_id=eq.${data.user.id}`, // ✅ only this user’s rows
          },
          () => {
            fetchBookmarks()
          }
        )
        .subscribe()
    }

    init()

    return () => {
      if (channel) supabase.removeChannel(channel)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function fetchBookmarks() {
    setLoading(true)

    const { data, error } = await supabase
      .from("bookmarks")
      .select("id,title,url,created_at")
      .order("created_at", { ascending: false })

    if (error) {
      setToast({ type: "error", message: error.message })
      setLoading(false)
      return
    }

    setBookmarks(data ?? [])
    setLoading(false)
  }

  async function addBookmark() {
    const cleanTitle = title.trim()
    const fixedUrl = safeUrl(url)

    if (!cleanTitle || !fixedUrl) {
      setToast({ type: "error", message: "Please enter both Title and URL." })
      return
    }
    if (!isValidUrl(fixedUrl)) {
      setToast({
        type: "error",
        message: "URL is invalid. Example: https://google.com",
      })
      return
    }

    setSaving(true)

    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) {
      setSaving(false)
      return
    }

    const { error } = await supabase.from("bookmarks").insert({
      title: cleanTitle,
      url: fixedUrl,
      user_id: userData.user.id,
    })

    setSaving(false)

    if (error) {
      setToast({ type: "error", message: error.message })
      return
    }

    setTitle("")
    setUrl("")
    setToast({ type: "success", message: "Bookmark added!" })
    // Optional: fetch immediately (realtime will also refresh)
    fetchBookmarks()
  }

  async function deleteBookmark(id: string) {
    const { error } = await supabase.from("bookmarks").delete().eq("id", id)
    if (error) {
      setToast({ type: "error", message: error.message })
      return
    }
    setToast({ type: "success", message: "Deleted successfully." })
    // Optional: fetch immediately (realtime will also refresh)
    fetchBookmarks()
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return bookmarks
    return bookmarks.filter(
      (b) => b.title.toLowerCase().includes(q) || b.url.toLowerCase().includes(q)
    )
  }, [bookmarks, query])

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-50">
          <div
            className={[
              "rounded-2xl border px-4 py-3 shadow-lg backdrop-blur",
              toast.type === "success" &&
                "border-emerald-800 bg-emerald-950/40 text-emerald-200",
              toast.type === "error" &&
                "border-red-800 bg-red-950/40 text-red-200",
              toast.type === "info" &&
                "border-zinc-700 bg-zinc-900/40 text-zinc-200",
            ].join(" ")}
          >
            <p className="text-sm font-medium">{toast.message}</p>
          </div>
        </div>
      )}

      {/* Top bar */}
      <header className="sticky top-0 z-10 border-b border-zinc-900 bg-zinc-950/70 backdrop-blur">
        <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-400 shadow-sm" />
            <div>
              <h1 className="text-lg font-semibold leading-tight">Smart Bookmark</h1>
              <p className="text-xs text-zinc-400">
                Private workspace • Supabase Auth + RLS + Realtime
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <p className="text-xs text-zinc-400">Signed in</p>
              <p className="text-sm text-zinc-200">{email}</p>
            </div>

            <button
              onClick={async () => {
                await supabase.auth.signOut()
                window.location.href = "/auth"
              }}
              className="group relative overflow-hidden rounded-2xl px-5 py-2.5 text-sm font-semibold
                         border border-zinc-800 bg-zinc-900/40 hover:border-red-700/60
                         hover:bg-red-600/15 transition flex items-center gap-2"
            >
              <span className="inline-block h-2.5 w-2.5 rounded-full bg-zinc-400 group-hover:bg-red-400 transition" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="mx-auto max-w-6xl px-4 pt-8 pb-4">
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-5">
            <p className="text-xs text-zinc-400">Total bookmarks</p>
            <p className="mt-2 text-3xl font-semibold">{bookmarks.length}</p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-5">
            <p className="text-xs text-zinc-400">Realtime</p>
            <p className="mt-2 text-lg font-medium text-zinc-200">
              Enabled{" "}
              <span className="ml-2 inline-flex h-2 w-2 rounded-full bg-emerald-400 align-middle" />
            </p>
            <p className="mt-1 text-xs text-zinc-500">Open 2 tabs to verify.</p>
          </div>

          <div className="rounded-3xl border border-zinc-800 bg-zinc-900/30 p-5">
            <p className="text-xs text-zinc-400">Security</p>
            <p className="mt-2 text-lg font-medium text-zinc-200">RLS Protected</p>
            <p className="mt-1 text-xs text-zinc-500">Private per user.</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="mx-auto max-w-6xl px-4 pb-12">
        <section className="grid gap-6 lg:grid-cols-5">
          {/* Add card */}
          <div className="lg:col-span-2 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div>
              <h3 className="text-lg font-semibold">Add bookmark</h3>
              <p className="mt-1 text-sm text-zinc-400">
                Press <span className="text-zinc-200">Enter</span> to add quickly.
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              <label className="grid gap-2">
                <span className="text-xs text-zinc-400">Title</span>
                <input
                  className="rounded-2xl bg-zinc-950/60 border border-zinc-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="e.g., Google Docs"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addBookmark()
                  }}
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs text-zinc-400">URL</span>
                <input
                  className="rounded-2xl bg-zinc-950/60 border border-zinc-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="https://docs.google.com"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addBookmark()
                  }}
                />
              </label>

              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={addBookmark}
                  disabled={saving}
                  className="rounded-2xl bg-blue-600 hover:bg-blue-500 disabled:opacity-60 px-5 py-3 text-sm font-semibold transition"
                >
                  {saving ? "Saving…" : "Add"}
                </button>

                <button
                  onClick={() => {
                    setTitle("")
                    setUrl("")
                    setToast({ type: "info", message: "Cleared inputs." })
                  }}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 px-5 py-3 text-sm transition"
                >
                  Clear
                </button>
              </div>

              <div className="mt-3 rounded-2xl border border-zinc-800 bg-zinc-950/30 p-4">
                <p className="text-xs text-zinc-500">
                  ✅ Private per user (RLS) • ✅ Add/Delete • ✅ Realtime updates
                </p>
              </div>
            </div>
          </div>

          {/* List card */}
          <div className="lg:col-span-3 rounded-3xl border border-zinc-800 bg-zinc-900/30 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-lg font-semibold">Bookmarks</h3>
                <p className="mt-1 text-sm text-zinc-400">Search by title or URL.</p>
              </div>

              <div className="flex items-center gap-2">
                <input
                  className="w-full sm:w-80 rounded-2xl bg-zinc-950/60 border border-zinc-800 px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  placeholder="Search…"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                />
                <button
                  onClick={fetchBookmarks}
                  className="rounded-2xl border border-zinc-800 bg-zinc-950/40 hover:bg-zinc-900 px-5 py-3 text-sm transition"
                >
                  Refresh
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3">
              {loading ? (
                <div className="grid gap-3">
                  <div className="h-20 rounded-2xl bg-zinc-950/40 border border-zinc-800 animate-pulse" />
                  <div className="h-20 rounded-2xl bg-zinc-950/40 border border-zinc-800 animate-pulse" />
                </div>
              ) : filtered.length === 0 ? (
                <div className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-10 text-center">
                  <p className="text-zinc-300 font-medium">No bookmarks found</p>
                  <p className="mt-2 text-sm text-zinc-500">
                    Try a different search or add a new bookmark.
                  </p>
                </div>
              ) : (
                filtered.map((b) => {
                  const domain = getDomain(b.url)
                  const favicon = domain
                    ? `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
                    : ""

                  return (
                    <div
                      key={b.id}
                      className="rounded-3xl border border-zinc-800 bg-zinc-950/30 p-4 flex items-start justify-between gap-4 hover:bg-zinc-950/40 transition"
                    >
                      <div className="min-w-0 flex items-start gap-3">
                        <div className="mt-1 h-10 w-10 rounded-2xl border border-zinc-800 bg-zinc-900/40 flex items-center justify-center overflow-hidden">
                          {favicon ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={favicon} alt="" className="h-5 w-5" />
                          ) : (
                            <span className="text-xs text-zinc-500">🔗</span>
                          )}
                        </div>

                        <div className="min-w-0">
                          <a
                            href={b.url}
                            target="_blank"
                            rel="noreferrer"
                            className="font-semibold hover:underline break-words"
                          >
                            {b.title}
                          </a>

                          <p className="mt-1 text-xs text-zinc-500 break-words">
                            {b.url}
                          </p>

                          {domain && (
                            <span className="mt-2 inline-flex items-center rounded-full border border-zinc-800 bg-zinc-900/40 px-2.5 py-1 text-[11px] text-zinc-300">
                              {domain}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={async () => {
                            await navigator.clipboard.writeText(b.url)
                            setToast({ type: "success", message: "Link copied!" })
                          }}
                          className="rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 px-3 py-2 text-sm transition"
                        >
                          Copy
                        </button>

                        <a
                          href={b.url}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-zinc-900 px-3 py-2 text-sm transition"
                        >
                          Open
                        </a>

                        <button
                          onClick={() => deleteBookmark(b.id)}
                          className="rounded-2xl border border-zinc-800 bg-zinc-900/40 hover:bg-red-600/80 px-3 py-2 text-sm transition"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>

            <p className="mt-4 text-xs text-zinc-500">
              Realtime test: open two tabs on{" "}
              <span className="text-zinc-200">/dashboard</span>, add in one tab → it
              appears in the other.
            </p>
          </div>
        </section>
      </main>

      <footer className="border-t border-zinc-900">
        <div className="mx-auto max-w-6xl px-4 py-6 text-xs text-zinc-500">
          © {new Date().getFullYear()} Smart Bookmark • Next.js App Router • Supabase
          Auth/DB/Realtime • Tailwind CSS
        </div>
      </footer>
    </div>
  )
}
