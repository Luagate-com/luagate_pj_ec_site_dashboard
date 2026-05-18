import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { Mail, Lock, Eye, EyeOff, BarChart3 } from "lucide-react";
import { apiPost, formatApiError } from "../lib/api";
import { getToken, setToken, updateCurrentUser } from "../lib/auth";
import type { AuthResponse } from "../types";

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("alice@example.com");
  const [password, setPassword] = useState("password123");
  const [showPassword, setShowPassword] = useState(false);
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
        "/api/auth/login",
        { email, password },
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
          <h1 className="text-4xl font-bold text-ink mb-2">EC売上分析</h1>
          <p className="text-sm text-ink-sub">データドリブンな意思決定をサポート</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-ink mb-1.5">メールアドレス</label>
            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand pointer-events-none"
              />
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
            <label className="block text-sm font-medium text-ink mb-1.5">パスワード</label>
            <div className="relative">
              <Lock
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-brand pointer-events-none"
              />
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                placeholder="・・・・・・・・"
                className="w-full rounded-xl border border-line pl-10 pr-10 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "パスワードを隠す" : "パスワードを表示"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-disabled hover:text-ink-sub"
              >
                {showPassword ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
          </div>

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand hover:bg-brand-hover disabled:bg-muted text-white font-bold py-3 rounded-xl transition mt-2"
          >
            {submitting ? "ログイン中..." : "ログイン"}
          </button>
        </form>

        <p className="mt-6 text-sm text-ink-sub text-center">
          アカウントをお持ちでない方は{" "}
          <Link to="/signup" className="text-brand hover:underline font-bold">
            新規登録
          </Link>
        </p>

        <div className="mt-8 rounded-xl border border-line bg-surface-second p-4 text-xs text-ink-sub">
          <p className="mb-1 font-semibold text-ink">デモアカウント</p>
          <p>alice@example.com / password123</p>
        </div>
      </div>
    </div>
  );
}
