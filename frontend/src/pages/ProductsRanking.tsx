import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Header } from "../components/Header";
import { Breadcrumb } from "../components/Breadcrumb";
import { LineChart } from "../components/LineChart";
import { RankingList } from "../components/RankingList";
import { apiGet, formatApiError } from "../lib/api";
import { formatNumber, formatYenCompact } from "../lib/format";
import type { OrderRankingResponse, SalesRankingResponse } from "../types";

type Mode = "sales" | "orders";

export function ProductsRanking() {
  const location = useLocation();
  const mode: Mode = location.pathname.includes("/orders") ? "orders" : "sales";

  const [year, setYear] = useState(2025);
  const [sales, setSales] = useState<SalesRankingResponse | null>(null);
  const [orders, setOrders] = useState<OrderRankingResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    if (mode === "sales") {
      apiGet<SalesRankingResponse>(`/api/dashboard/products/sales-ranking?year=${year}`)
        .then((d) => !cancelled && setSales(d))
        .catch((e) => !cancelled && setError(formatApiError(e)));
    } else {
      apiGet<OrderRankingResponse>(`/api/dashboard/products/order-ranking?year=${year}`)
        .then((d) => !cancelled && setOrders(d))
        .catch((e) => !cancelled && setError(formatApiError(e)));
    }
    return () => {
      cancelled = true;
    };
  }, [year, mode]);

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb
          items={[
            { label: "ダッシュボード", to: "/" },
            { label: "商品ランキング" },
            { label: mode === "sales" ? "売上ランキング" : "注文数ランキング" },
          ]}
        />
        <h2 className="mt-3 text-2xl font-bold text-ink">
          {mode === "sales" ? "商品売上ランキング" : "商品注文数ランキング"}
        </h2>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-full border border-line bg-white p-1">
            <Link
              to="/products/sales"
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium transition " +
                (mode === "sales" ? "bg-brand text-white" : "text-ink-sub hover:text-ink")
              }
            >
              売上順
            </Link>
            <Link
              to="/products/orders"
              className={
                "rounded-full px-4 py-1.5 text-sm font-medium transition " +
                (mode === "orders" ? "bg-brand text-white" : "text-ink-sub hover:text-ink")
              }
            >
              注文数順
            </Link>
          </div>
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
        </div>

        {/* 注文数推移 (注文数ランキング時のみ) */}
        {mode === "orders" && orders && (
          <div className="mt-6 rounded-2xl border border-line bg-white p-6">
            <h3 className="mb-4 text-base font-bold text-ink">{year}年 月別注文数推移</h3>
            <LineChart
              data={orders.monthly}
              xKey="label"
              yKey="orders"
              yLabel="注文数"
              formatY={(v) => formatNumber(v)}
            />
          </div>
        )}

        {/* ランキング */}
        <div className="mt-6">
          {mode === "sales" && sales && (
            <RankingList
              title={`売上 TOP ${sales.ranking.length}`}
              items={sales.ranking.map((r) => ({ name: r.name, value: r.revenue }))}
              formatValue={(v) => formatYenCompact(v)}
            />
          )}
          {mode === "orders" && orders && (
            <RankingList
              title={`注文数 TOP ${orders.ranking.length}`}
              items={orders.ranking.map((r) => ({ name: r.name, value: r.units }))}
              formatValue={(v) => `${formatNumber(v)}個`}
              color="#0EA5E9"
            />
          )}
        </div>
      </main>
    </div>
  );
}
