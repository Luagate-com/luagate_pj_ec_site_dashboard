import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatYen } from "../lib/format";

// Figma 仕様の 5 カテゴリ色 (緑系 + アクセント)
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
  return (
    <div className="relative">
      <ResponsiveContainer width="100%" height={320}>
        <PieChart>
          <Pie
            data={data}
            dataKey="revenue"
            nameKey="category"
            cx="50%"
            cy="50%"
            innerRadius={80}
            outerRadius={130}
            paddingAngle={2}
            stroke="none"
          >
            {data.map((entry) => (
              <Cell key={entry.category} fill={CATEGORY_COLORS[entry.category] ?? "#AEADA9"} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, _name: string, entry) => {
              const cat = entry?.payload?.category as string | undefined;
              const share = entry?.payload?.share as number | undefined;
              return [`${formatYen(value)} (${share ?? 0}%)`, cat ?? ""];
            }}
            contentStyle={{ borderRadius: 8, borderColor: "#DCDCD9", fontSize: 12 }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xs text-ink-sub">{centerLabel}</span>
        <span className="text-2xl font-bold text-ink">{centerValue}</span>
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
