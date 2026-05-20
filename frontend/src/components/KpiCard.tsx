import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface KpiCardProps {
  label: string;
  value: string;
  delta: number;
  deltaLabel: string;
  detailHref: string;
  children?: React.ReactNode; // ミニグラフ (Sparkline / 棒グラフ)
}

// Ch13 KPI カード
// - ラベル (左上) と 増減バッジ (右上)。delta が 0 以上なら緑、負なら赤
// - 大きな数値表示 (value, 3xl bold)
// - children でミニグラフを差し込む (Sparkline / MiniBarChart)
// - 詳細ボタン (Link to detailHref)
export function KpiCard({ label, value, delta, deltaLabel, detailHref, children }: KpiCardProps) {
  const isUp = delta >= 0;
  const DeltaIcon = isUp ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-6">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-ink-sub">{label}</span>
        <span
          className={
            "inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-semibold " +
            (isUp ? "bg-brand-light text-brand" : "bg-danger-light text-danger")
          }
        >
          <DeltaIcon size={12} />
          {deltaLabel}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold tabular-nums text-ink">{value}</p>
      <div className="mt-4 h-16">{children}</div>
      <Link
        to={detailHref}
        className="mt-4 inline-flex items-center justify-center gap-1 rounded-lg border border-line bg-white py-2 text-sm font-medium text-ink hover:bg-surface-second"
      >
        詳細
        <ChevronRight size={14} />
      </Link>
    </div>
  );
}
