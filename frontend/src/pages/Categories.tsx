import { useEffect, useState } from "react";
import { Header } from "../components/Header";
import { Breadcrumb } from "../components/Breadcrumb";
import { LineChart } from "../components/LineChart";
import { DonutChart, CategoryColorSwatch } from "../components/DonutChart";
import { apiGet, formatApiError } from "../lib/api";
import { formatYen, formatYenCompact } from "../lib/format";
import type { CategoryResponse } from "../types";

export function Categories() {
  const [year, setYear] = useState(2025);
  const [data, setData] = useState<CategoryResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    apiGet<CategoryResponse>(`/api/dashboard/categories?year=${year}`)
      .then((d) => !cancelled && setData(d))
      .catch((e) => !cancelled && setError(formatApiError(e)));
    return () => {
      cancelled = true;
    };
  }, [year]);

  return (
    <div className="min-h-full">
      <Header />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <Breadcrumb items={[{ label: "ダッシュボード", to: "/" }, { label: "カテゴリ分析" }]} />
        <h2 className="mt-3 text-2xl font-bold text-ink">カテゴリ分析</h2>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
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

        {data && (
          <>
            {/* 客単価推移 */}
            <div className="mt-6 rounded-2xl border border-line bg-white p-6">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-ink">{year}年 月別客単価推移</h3>
                <span className="text-xs text-ink-sub">単位: 円</span>
              </div>
              <LineChart
                data={data.monthly}
                xKey="label"
                yKey="aov"
                yLabel="客単価"
                formatY={(v) => formatYenCompact(v)}
                color="#0EA5E9"
              />
            </div>

            {/* ドーナツチャート + 凡例 */}
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-line bg-white p-6">
                <h3 className="mb-4 text-base font-bold text-ink">カテゴリ別売上シェア</h3>
                <DonutChart
                  data={data.categories.map((c) => ({
                    category: c.category,
                    revenue: c.revenue,
                    share: c.share,
                  }))}
                  centerLabel="平均客単価"
                  centerValue={formatYen(data.overallAov)}
                />
              </div>

              <div className="rounded-2xl border border-line bg-white p-6">
                <h3 className="mb-4 text-base font-bold text-ink">カテゴリ別サマリ</h3>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-ink-sub">
                      <th className="pb-3 font-medium">カテゴリ</th>
                      <th className="pb-3 text-right font-medium">売上</th>
                      <th className="pb-3 text-right font-medium">シェア</th>
                      <th className="pb-3 text-right font-medium">客単価</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.categories.map((c) => (
                      <tr key={c.category} className="border-t border-line">
                        <td className="py-3">
                          <span className="inline-flex items-center gap-2">
                            <CategoryColorSwatch category={c.category} />
                            <span className="font-medium text-ink">{c.category}</span>
                          </span>
                        </td>
                        <td className="py-3 text-right text-ink">{formatYenCompact(c.revenue)}</td>
                        <td className="py-3 text-right text-ink">{c.share}%</td>
                        <td className="py-3 text-right text-ink">{formatYen(c.averageOrderValue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
