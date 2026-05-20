// Ch15 ランキングリスト (横棒チャート)
// Recharts BarChart layout=vertical
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

export function RankingList({
  items,
  formatValue,
  color = "#05B45B",
  title,
}: RankingListProps) {
  const data = items.slice(0, 10);
  const height = Math.max(320, data.length * 36);

  return (
    <div className="rounded-2xl border border-line bg-white p-6">
      {title && <h3 className="mb-4 text-base font-bold text-ink">{title}</h3>}
      {data.length === 0 ? (
        <p className="text-sm text-ink-sub">データがありません</p>
      ) : (
        <div style={{ height }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 8, right: 24, bottom: 8, left: 8 }}
            >
              <XAxis
                type="number"
                tick={{ fill: "#727270", fontSize: 12 }}
                stroke="#DCDCD9"
                tickFormatter={formatValue}
              />
              <YAxis
                dataKey="name"
                type="category"
                width={180}
                tick={{ fill: "#363635", fontSize: 12 }}
                stroke="#DCDCD9"
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: "1px solid #DCDCD9", fontSize: 12 }}
                formatter={(value: number) => (formatValue ? formatValue(value) : String(value))}
              />
              <Bar dataKey="value" fill={color} radius={[0, 4, 4, 0]}>
                {data.map((_, idx) => (
                  <Cell key={`cell-${idx}`} fill={color} fillOpacity={1 - idx * 0.06} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
