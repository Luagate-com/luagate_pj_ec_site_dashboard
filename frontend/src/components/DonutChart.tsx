// Ch15 ドーナツ (円) チャート + 凡例
// Recharts の PieChart でカテゴリ別売上シェアを表示する。
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

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
  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
      {/* relative 親 + absolute オーバーレイで中央に値を重ねる */}
      <div className="relative h-[320px] w-full sm:w-1/2">
        <ResponsiveContainer width="100%" height="100%">
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
              isAnimationActive={false}
            >
              {data.map((seg) => (
                <Cell
                  key={seg.category}
                  fill={CATEGORY_COLORS[seg.category] ?? "#AEADA9"}
                />
              ))}
            </Pie>
            <Tooltip formatter={(value: number) => `${value.toLocaleString("ja-JP")} 円`} />
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-xs text-ink-sub">{centerLabel}</div>
          <div className="text-2xl font-bold text-ink">{centerValue}</div>
        </div>
      </div>
      {/* 凡例 */}
      <ul className="w-full space-y-2 sm:w-1/2">
        {data.map((seg) => (
          <li
            key={seg.category}
            className="flex items-center justify-between border-b border-dashed border-line py-1.5 text-sm"
          >
            <span className="flex items-center gap-2 text-ink">
              <CategoryColorSwatch category={seg.category} />
              {seg.category}
            </span>
            <span className="tabular-nums text-ink-sub">{seg.share}%</span>
          </li>
        ))}
      </ul>
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
