// Ch13 KPI カード
// - ラベル + 増減バッジ (delta >= 0 は緑、負は赤)
// - 大数値 (3xl bold)
// - children でミニグラフ差し込み
// - 詳細ボタン (Link)
import { ArrowDownRight, ArrowUpRight, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface KpiCardProps {
  label: string;
  value: string;
  delta: number;
  deltaLabel: string;
  detailHref: string;
  children?: React.ReactNode;
}

export function KpiCard({ label, value, delta, deltaLabel, detailHref, children }: KpiCardProps) {
  const positive = delta >= 0;
  const badgeClass = positive
    ? "bg-brand-light text-brand"
    : "bg-danger-light text-danger";
  const Icon = positive ? ArrowUpRight : ArrowDownRight;

  return (
    <div className="flex flex-col rounded-2xl border border-line bg-white p-6">
      <div className="flex items-start justify-between">
        <span className="text-sm font-medium text-ink-sub">{label}</span>
        <span className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium ${badgeClass}`}>
          <Icon size={12} />
          {deltaLabel}
        </span>
      </div>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
      <div className="mt-4 h-16">
        {children ?? <div className="flex h-full items-center justify-center text-xs text-ink-sub">—</div>}
      </div>
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
