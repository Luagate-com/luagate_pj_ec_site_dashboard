import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Mail, Lock, User as UserIcon, BarChart3 } from "lucide-react";
import { apiPost, formatApiError } from "../lib/api";
import { getToken, setToken, updateCurrentUser } from "../lib/auth";
import type { AuthResponse } from "../types";

export function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (getToken()) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await apiPost<AuthResponse>(
        "/api/auth/signup",
        { email, password, displayName },
        { skipAuthRedirect: true },
      );
      setToken(res.token);
      updateCurrentUser(res.user);
      navigate("/", { replace: true });
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center p-4 bg-canvas">
      <div className="w-full max-w-md">
        <div className="text-center mb-12">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-light">
            <BarChart3 className="text-brand" size={28} />
          </div>
          <h1 className="text-4xl font-bold text-ink mb-2">新規登録</h1>
          <p className="text-sm text-ink-sub">EC売上分析ダッシュボードへようこそ</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">表示名</label>
            <div className="relative">
              <UserIcon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand pointer-events-none" />
              <input
                type="text"
                required
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="山田 太郎"
                className="w-full rounded-xl border border-line pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">メールアドレス</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand pointer-events-none" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                placeholder="example@mail.com"
                className="w-full rounded-xl border border-line pl-10 pr-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">パスワード (8文字以上)</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand pointer-events-none" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                placeholder="・・・・・・・・"
                className="w-full rounded-xl border border-line pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand hover:bg-brand-hover disabled:bg-muted text-white font-bold py-3 rounded-xl transition mt-2"
          >
            {submitting ? "登録中..." : "新規登録"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-sub text-center">
          既にアカウントをお持ちの方は{" "}
          <Link to="/login" className="text-brand hover:underline font-bold">
            ログイン
          </Link>
        </p>
      </div>
    </div>
  );
}
