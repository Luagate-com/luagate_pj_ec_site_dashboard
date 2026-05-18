import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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

// Figma の横棒チャート風ランキング
export function RankingList({ items, formatValue, color = "#05B45B", title }: RankingListProps) {
  const data = items.map((it, idx) => ({ ...it, rank: idx + 1 }));

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      {title && <h3 className="mb-4 text-base font-bold text-ink">{title}</h3>}
      <ResponsiveContainer width="100%" height={Math.max(320, items.length * 36)}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 24, left: 8, bottom: 4 }}>
          <XAxis
            type="number"
            stroke="#727270"
            fontSize={11}
            tickFormatter={formatValue ? (v: number) => formatValue(v) : undefined}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#363635"
            fontSize={12}
            width={180}
            tick={{ fill: "#363635" }}
          />
          <Tooltip
            formatter={(value: number) => [formatValue ? formatValue(value) : value.toLocaleString("ja-JP"), ""]}
            contentStyle={{ borderRadius: 8, borderColor: "#DCDCD9", fontSize: 12 }}
          />
          <Bar dataKey="value" radius={[0, 4, 4, 0]}>
            {data.map((_, idx) => (
              <Cell key={idx} fill={color} fillOpacity={1 - idx * 0.06} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
