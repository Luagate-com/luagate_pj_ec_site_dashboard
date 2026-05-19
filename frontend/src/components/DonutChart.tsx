// TODO Ch7-8 ドーナツ (円) チャート + 凡例実装
// Recharts (PieChart, Pie, Cell, ResponsiveContainer, Tooltip) で
// カテゴリ別売上シェアを表示してください。
// ヒント
// - innerRadius=80, outerRadius=130 でドーナツ
// - data.map で Cell に CATEGORY_COLORS から色を割り当てる
// - 中央に平均客単価を絶対配置で表示 (pointer-events-none)

// Figma 仕様の 5 カテゴリ色 (緑系 + アクセント)。完成版でも同じ配色を使います。
const CATEGORY_COLORS: Record<string, string> = {
  "エレクトロニクス": "#05B45B",
  "ファッション": "#0EA5E9",
  "ホーム&キッチン": "#F2B705",
  "スポーツ&アウトドア": "#A78BFA",
  "書籍&メディア": "#F15025",
};

interface DonutSegment {
  category: string;
  revenue: number;
  share: number;
}

interface DonutChartProps {
  data: DonutSegment[];
  centerLabel: string;
  centerValue: string;
}

export function DonutChart({ data, centerLabel, centerValue }: DonutChartProps) {
  // TODO 受講生はここを Recharts の PieChart で書き換えてください
  return (
    <div className="relative flex h-[320px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-line bg-surface-second text-sm text-ink-sub">
      <span>TODO Ch7-8 ドーナツチャート ({data.length} カテゴリ)</span>
      <div className="mt-4 text-center">
        <div className="text-xs text-ink-sub">{centerLabel}</div>
        <div className="text-2xl font-bold text-ink">{centerValue}</div>
      </div>
    </div>
  );
}

export function CategoryColorSwatch({ category }: { category: string }) {
  return (
    <span
      className="inline-block h-3 w-3 rounded-sm"
      style={{ backgroundColor: CATEGORY_COLORS[category] ?? "#AEADA9" }}
    />
  );
}

export { CATEGORY_COLORS };
