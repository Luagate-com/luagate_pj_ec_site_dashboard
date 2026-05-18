import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { Header } from "../components/Header";
import { KpiCard } from "../components/KpiCard";
import { Sparkline, MiniBarChart } from "../components/Sparkline";
import { apiGet, formatApiError } from "../lib/api";
import { formatDateTimeJa, formatDelta, formatNumber, formatYen } from "../lib/format";
import type { SummaryResponse } from "../types";

export function Dashboard() {
  const [summary, setSummary] = useState<SummaryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    apiGet<SummaryResponse>("/api/dashboard/summary")
      .then((data) => {
        if (!cancelled) setSummary(data);
      })
      .catch((err) => {
        if (!cancelled) setError(formatApiError(err));
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h2 className="text-2xl font-bold text-ink">総合ダッシュボード</h2>
            <p className="mt-1 text-sm text-ink-sub">主要指標の概況と直近の推移を確認できます。</p>
          </div>
          {summary && (
            <div className="inline-flex items-center gap-1.5 rounded-full bg-surface-second px-3 py-1.5 text-xs text-ink-sub">
              <Clock size={12} />
              最終更新 {formatDateTimeJa(summary.updatedAt)}
            </div>
          )}
        </div>

        {loading && <p className="text-sm text-ink-sub">読み込み中...</p>}
        {error && <p className="text-sm text-danger">{error}</p>}

        {summary && (
          <div className="grid gap-6 md:grid-cols-3">
            <KpiCard
              label="総売上"
              value={formatYen(summary.revenue.current)}
              delta={summary.revenue.delta}
              deltaLabel={formatDelta(summary.revenue.delta, "¥")}
              detailHref="/sales"
            >
              <Sparkline data={summary.revenue.sparkline} color="#05B45B" />
            </KpiCard>

            <KpiCard
              label="総注文数"
              value={formatNumber(summary.orders.current)}
              delta={summary.orders.delta}
              deltaLabel={formatDelta(summary.orders.delta)}
              detailHref="/products/orders"
            >
              <MiniBarChart data={summary.orders.sparkline} color="#05B45B" />
            </KpiCard>

            <KpiCard
              label="客単価"
              value={formatYen(summary.aov.current)}
              delta={summary.aov.delta}
              deltaLabel={formatDelta(summary.aov.delta, "¥")}
              detailHref="/categories"
            >
              <Sparkline data={summary.aov.sparkline} color="#05B45B" />
            </KpiCard>
          </div>
        )}

        <section className="mt-10 rounded-2xl border border-line bg-white p-6">
          <h3 className="text-base font-bold text-ink">ダッシュボードの読み方</h3>
          <ul className="mt-3 space-y-2 text-sm text-ink-sub">
            <li>各 KPI カードの右上の増減バッジは前年度との差分を表示しています。</li>
            <li>「詳細」ボタンで各分析ページに遷移できます。</li>
            <li>売上推移ページでは月別 / 週別の切り替えと TOP 10 商品を確認できます。</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
