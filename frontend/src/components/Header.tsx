import { LogOut, BarChart3 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { clearToken, useCurrentUser } from "../lib/auth";

const NAV_ITEMS: Array<{ label: string; to: string }> = [
  { label: "ダッシュボード", to: "/" },
  { label: "売上推移", to: "/sales" },
  { label: "商品ランキング", to: "/products/sales" },
  { label: "カテゴリ分析", to: "/categories" },
];

export function Header() {
  const user = useCurrentUser();
  const navigate = useNavigate();
  const location = useLocation();

  function handleLogout() {
    clearToken();
    navigate("/login", { replace: true });
  }

  function isActive(to: string): boolean {
    if (to === "/") return location.pathname === "/";
    return location.pathname.startsWith(to);
  }

  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
        <div className="flex items-center gap-2">
          <BarChart3 className="text-brand" size={22} />
          <h1 className="text-lg font-bold text-ink">EC売上分析ダッシュボード</h1>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-surface-second px-4 py-1.5 text-sm font-medium text-ink">
            {user?.displayName ?? "ゲスト"}
          </span>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-4 py-1.5 text-sm font-medium text-ink hover:bg-surface-second"
          >
            <LogOut size={16} />
            ログアウト
          </button>
        </div>
      </div>
      {/* セカンダリナビ */}
      <nav className="mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-6 pb-1">
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={
              "rounded-t-lg px-4 py-2 text-sm font-medium transition " +
              (isActive(item.to)
                ? "border-b-2 border-brand text-brand"
                : "border-b-2 border-transparent text-ink-sub hover:text-ink")
            }
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
