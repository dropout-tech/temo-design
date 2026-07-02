"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Lock } from "lucide-react"
import { createClient } from "@/lib/supabase/client"

export default function StudioLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError("登入失敗：帳號或密碼不正確")
      setLoading(false)
      return
    }
    router.push("/studio")
    router.refresh()
  }

  return (
    <main className="min-h-screen bg-temo-black flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        {/* 標誌 */}
        <div className="mb-10 text-center">
          <p className="text-[10px] tracking-[0.5em] text-temo-gold uppercase mb-3">TEMO</p>
          <h1 className="text-2xl font-bold text-temo-white tracking-wide">Studio 後台</h1>
          <p className="text-sm text-temo-warm-gray/60 mt-2">登入以管理網站內容</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[11px] tracking-[0.2em] text-temo-warm-gray/70 uppercase mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:bg-white/[0.05] focus:outline-none transition-all rounded-sm"
              placeholder="you@temo.design"
            />
          </div>

          <div>
            <label className="block text-[11px] tracking-[0.2em] text-temo-warm-gray/70 uppercase mb-2">
              密碼
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 text-temo-white text-sm placeholder:text-white/20 focus:border-temo-gold/60 focus:bg-white/[0.05] focus:outline-none transition-all rounded-sm"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-sm text-red-400/90">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 px-6 py-3.5 bg-temo-gold text-temo-black text-xs font-bold tracking-[0.2em] uppercase hover:brightness-110 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed transition-all rounded-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Lock className="w-3.5 h-3.5" />
            )}
            {loading ? "登入中…" : "登入"}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-temo-warm-gray/40">
          此後台僅供 TEMO DESIGN 內部管理使用
        </p>
      </div>
    </main>
  )
}
