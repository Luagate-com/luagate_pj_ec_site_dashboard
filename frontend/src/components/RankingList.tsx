// Ch15 ランキングリスト (横棒チャート)
// Recharts の BarChart を layout="vertical" にして横棒のランキングを描画する。
import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

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

export function RankingList({ items, formatValue, color = "#05B45B", title }: RankingListProps) {
  const top = items.slice(0, 10);
  // アイテム数に応じて高さを伸ばす
  const height = Math.max(320, top.length * 36);

  if (top.length === 0) {
    return (
      <div className="rounded-2xl border border-line bg-white p-6">
        {title && <h3 className="mb-4 text-base font-bold text-ink">{title}</h3>}
        <div className="flex h-[200px] items-center justify-center text-sm text-ink-sub">
          データがありません
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      {title && <h3 className="mb-4 text-base font-bold text-ink">{title}</h3>}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart layout="vertical" data={top} margin={{ top: 4, right: 24, bottom: 4, left: 8 }}>
          <XAxis
            type="number"
            stroke="#727270"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={formatValue ? (v: number) => formatValue(v) : undefined}
          />
          <YAxis
            type="category"
            dataKey="name"
            width={180}
            stroke="#363635"
            fontSize={11}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) => (v.length > 14 ? v.slice(0, 14) + "…" : v)}
          />
          <Tooltip
            formatter={(value: number) => (formatValue ? formatValue(value) : value.toLocaleString("ja-JP"))}
          />
          <Bar dataKey="value" radius={[0, 6, 6, 0]}>
            {top.map((_, idx) => (
              // 1 位ほど濃く (上位ほど fillOpacity が高い)
              <Cell key={idx} fill={color} fillOpacity={Math.max(0.4, 1 - idx * 0.06)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
