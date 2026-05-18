import { clearToken, getToken } from "./auth";

// 本番では VITE_API_BASE_URL でフル URL を指定する。
// 開発時は Vite の dev proxy が /api を localhost:3032 に転送するので、空文字 (= 同一オリジン) でよい。
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ?? "";

export class ApiError extends Error {
  status: number;
  payload: unknown;

  constructor(status: number, payload: unknown, message?: string) {
    super(message || `API error ${status}`);
    this.status = status;
    this.payload = payload;
  }
}

interface RequestOptions {
  // 401 時の自動リダイレクトを抑止したい場合 (ログイン画面など) に true
  skipAuthRedirect?: boolean;
}

async function request<T>(method: string, path: string, body?: unknown, opts: RequestOptions = {}): Promise<T> {
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const token = getToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) {
    return undefined as T;
  }

  const contentType = res.headers.get("content-type") || "";
  const payload = contentType.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    if (res.status === 401 && !opts.skipAuthRedirect) {
      clearToken();
      if (typeof window !== "undefined" && !window.location.pathname.startsWith("/login") && !window.location.pathname.startsWith("/signup")) {
        window.location.assign("/login");
      }
    }
    throw new ApiError(res.status, payload);
  }

  return payload as T;
}

export function apiGet<T>(path: string, opts?: RequestOptions): Promise<T> {
  return request<T>("GET", path, undefined, opts);
}

export function apiPost<T>(path: string, body?: unknown, opts?: RequestOptions): Promise<T> {
  return request<T>("POST", path, body, opts);
}

// エラーメッセージを UI 用に整形する
export function formatApiError(err: unknown): string {
  if (err instanceof ApiError) {
    const p = err.payload;
    if (typeof p === "object" && p !== null) {
      const obj = p as Record<string, unknown>;
      if (typeof obj.error === "string") return obj.error;
      if (typeof obj.error === "object" && obj.error !== null) {
        const inner = obj.error as Record<string, unknown>;
        if (inner.fieldErrors && typeof inner.fieldErrors === "object") {
          const fe = inner.fieldErrors as Record<string, string[]>;
          const first = Object.values(fe)[0];
          if (Array.isArray(first) && first.length > 0) return first[0];
        }
      }
    }
    return err.message;
  }
  if (err instanceof Error) return err.message;
  return "不明なエラーが発生しました";
}
