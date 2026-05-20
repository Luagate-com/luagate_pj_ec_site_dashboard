import { ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

interface KpiCardProps {
  label: string;
  value: string;
  delta: number;
  deltaLabel: string;
  detailHref: string;
  children?: React.ReactNode; // ミニグラフ (Sparkline / 棒グラフ)
}

// TODO Ch13 KPI カード実装
// Figma の "KPI カード" 仕様を参考に下のスケルトンを仕上げてください。
// 仕様
// - ラベル (左上) と 増減バッジ (右上)。増減バッジは delta が 0 以上なら緑、負なら赤
// - 大きな数値表示 (value, 3xl bold)
// - children でミニグラフを差し込めるようにする (Sparkline / MiniBarChart)
// - 詳細ボタン (Link to detailHref)
// 必要な import
// - ArrowUpRight / ArrowDownRight (lucide-react) — 増減バッジのアイコン
export function KpiCard({ label, value, delta, deltaLabel, detailHref, children }: KpiCardProps) {
  // TODO 受講生はここを書き換えてください
  void delta;
  void deltaLabel;
  return (
    <div className="flex flex-col rounded-2xl border border-dashed border-line bg-white p-6">
      <span className="text-sm font-medium text-ink-sub">{label}</span>
      <p className="mt-3 text-3xl font-bold text-ink">{value}</p>
      <div className="mt-4 flex h-16 items-center justify-center text-xs text-ink-sub">
        TODO Ch13 ミニグラフ
      </div>
      {children}
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
