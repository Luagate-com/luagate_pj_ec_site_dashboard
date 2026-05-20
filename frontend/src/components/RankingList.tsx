// TODO Ch15 ランキングリスト (横棒チャート)
// Recharts (BarChart, Bar, Cell, XAxis, YAxis, Tooltip, ResponsiveContainer) を使い
// layout="vertical" で横棒のランキングチャートを描画してください。
// ヒント
// - height = max(320, items.length * 36) でアイテム数に応じて伸ばす
// - YAxis dataKey="name" type="category" width={180}
// - Cell fillOpacity={1 - idx * 0.06} で 1 位ほど濃く

interface RankingItem {
  name: string;
  value: number;
  unit?: string;
}

interface RankingListProps {
  items: RankingItem[];
  formatValue?: (value: number) => string;
  color?: string;
  title?: string;
}

export function RankingList({ items, formatValue, color: _color = "#05B45B", title }: RankingListProps) {
  // TODO 受講生はここを Recharts の BarChart (layout=vertical) で書き換えてください
  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      {title && <h3 className="mb-4 text-base font-bold text-ink">{title}</h3>}
      <div className="space-y-2">
        <p className="text-xs text-ink-sub">TODO Ch15 横棒ランキングチャート</p>
        <ul className="space-y-1 text-sm text-ink">
          {items.slice(0, 10).map((item, idx) => (
            <li key={`${item.name}-${idx}`} className="flex items-center justify-between border-b border-dashed border-line py-1">
              <span>
                {idx + 1}. {item.name}
              </span>
              <span className="text-ink-sub">
                {formatValue ? formatValue(item.value) : item.value.toLocaleString("ja-JP")}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
