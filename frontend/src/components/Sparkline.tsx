// Ch13 ミニグラフ (Sparkline / MiniBarChart)
// KPI カード内に埋め込む小さな折れ線・棒グラフ。
import { Bar, BarChart, Line, LineChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color = "#05B45B" }: SparklineProps) {
  const chartData = data.map((value, idx) => ({ idx, value }));
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface MiniBarChartProps {
  data: number[];
  color?: string;
}

export function MiniBarChart({ data, color = "#05B45B" }: MiniBarChartProps) {
  const chartData = data.map((value, idx) => ({ idx, value }));
  return (
    <div className="h-16 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
          <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
