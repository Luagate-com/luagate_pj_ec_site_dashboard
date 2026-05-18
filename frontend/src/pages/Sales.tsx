import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Breadcrumb } from "../components/Breadcrumb";
import { LineChart } from "../components/LineChart";
import { RankingList } from "../components/RankingList";
import { apiGet, formatApiError } from "../lib/api";
import { formatYen, formatYenCompact } from "../lib/format";
import type { MonthlyResponse, SalesRankingResponse, WeeklyResponse } from "../types";

type ViewMode = "monthly" | "weekly";

export function Sales() {
  const [view, setView] = useState<ViewMode>("monthly");
  const [year, setYear] = useState(2025);
  const [month, setMonth] = useState("2025-12");
  const [monthly, setMonthly] = useState<MonthlyResponse | null>(null);
  const [weekly, setWeekly] = useState<WeeklyResponse | null>(null);
  const [ranking, setRanking] = useState<SalesRankingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    apiGet<MonthlyResponse>(`/api/dashboard/monthly?year=${year}`)
      .then((d) => !cancelled && setMonthly(d))
      .catch((e) => !cancelled && setError(formatApiError(e)));
    apiGet<SalesRankingResponse>(`/api/dashboard/products/sales-ranking?year=${year}`)
      .then((d) => !cancelled && setRanking(d))
      .catch((e) => !cancelled && setError(formatApiError(e)));
    return () => {
      cancelled = true;
    };
  }, [year]);

  useEffect(() => {
    if (view !== "weekly") return;
    let cancelled = false;
    apiGet<WeeklyResponse>(`/api/dashboard/weekly?month=${month}`)
      .then((d) => !cancelled && setWeekly(d))
      .catch((e) => !cancelled && setError(formatApiError(e)));
    return () => {
      cancelled = true;
    };
  }, [view, month]);

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb items={[{ label: "ダッシュボード", to: "/" }, { label: "売上推移" }]} />
        <h2 className="mt-3 text-2xl font-bold text-ink">売上推移</h2>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-line bg-white p-1">
            <button
              type="button"
              onClick={() => setView("monthly")}
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium transition " +
                (view === "monthly" ? "bg-brand text-white" : "text-ink-sub hover:text-ink")
              }
            >
              月別
            </button>
            <button
              type="button"
              onClick={() => setView("weekly")}
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium transition " +
                (view === "weekly" ? "bg-brand text-white" : "text-ink-sub hover:text-ink")
              }
            >
              週別
            </button>
          </div>

          {view === "monthly" ? (
            <label className="inline-flex items-center gap-2 text-sm text-ink-sub">
              対象年度
              <select
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
              >
                {[2025, 2024, 2023].map((y) => (
                  <option key={y} value={y}>
                    {y}年
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="inline-flex items-center gap-2 text-sm text-ink-sub">
              対象月
              <input
                type="month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                className="rounded-lg border border-line bg-white px-3 py-1.5 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand"
              />
            </label>
          )}
        </div>

        {/* 折れ線グラフ */}
        <div className="mt-6 rounded-2xl border border-line bg-white p-6">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-base font-bold text-ink">
              {view === "monthly" ? `${year}年 月別売上推移` : `${month} 週別売上推移`}
            </h3>
            <span className="text-xs text-ink-sub">単位: 円</span>
          </div>
          {view === "monthly" && monthly ? (
            <LineChart
              data={monthly.monthly}
              xKey="label"
              yKey="revenue"
              yLabel="売上"
              formatY={(v) => formatYenCompact(v)}
            />
          ) : null}
          {view === "weekly" && weekly ? (
            <LineChart
              data={weekly.weekly}
              xKey="label"
              yKey="revenue"
              yLabel="売上"
              formatY={(v) => formatYenCompact(v)}
            />
          ) : null}
          {((view === "monthly" && !monthly) || (view === "weekly" && !weekly)) && (
            <p className="text-sm text-ink-sub">読み込み中...</p>
          )}
        </div>

        {/* 売上 TOP 10 ランキング */}
        <div className="mt-6">
          {ranking && (
            <RankingList
              title={`売上ランキング TOP ${ranking.ranking.length}`}
              items={ranking.ranking.map((r) => ({ name: r.name, value: r.revenue }))}
              formatValue={(v) => formatYenCompact(v)}
            />
          )}
        </div>

        {/* 学習者向け: 集計 SQL のヒント */}
        <details className="mt-6 rounded-2xl border border-line bg-surface-second p-6 text-sm text-ink">
          <summary className="cursor-pointer font-bold">集計 SQL のヒントを見る</summary>
          <pre className="mt-3 overflow-auto rounded-lg bg-white p-4 text-xs">{`-- 月別売上
SELECT
  DATE_TRUNC('month', created_at) AS month,
  SUM(total) AS revenue,
  COUNT(*) AS orders
FROM orders
WHERE EXTRACT(YEAR FROM created_at) = $1
GROUP BY 1
ORDER BY 1;`}</pre>
        </details>

        {ranking && ranking.ranking.length > 0 && (
          <p className="mt-4 text-xs text-ink-sub">
            1 位の売上: {formatYen(ranking.ranking[0].revenue)} ({ranking.ranking[0].name})
          </p>
        )}
      </main>
    </div>
  );
}
