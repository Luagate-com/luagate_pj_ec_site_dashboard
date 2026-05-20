// Ch13 / Ch14 ミニグラフ (Sparkline / MiniBarChart)
// KPI カード内に埋め込む小さな折れ線・棒グラフ。
// 軸やグリッドは描画しない (dot={false}, 余白なし)。
import { Bar, BarChart, Line, LineChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
}

// number[] を Recharts が扱える {idx, value}[] に変換する
function toPoints(data: number[]): Array<{ idx: number; value: number }> {
  return data.map((value, idx) => ({ idx, value }));
}

export function Sparkline({ data, color = "#05B45B" }: SparklineProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={toPoints(data)} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
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
  );
}

interface MiniBarChartProps {
  data: number[];
  color?: string;
}

export function MiniBarChart({ data, color = "#05B45B" }: MiniBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={toPoints(data)} margin={{ top: 4, right: 0, bottom: 4, left: 0 }}>
        <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} isAnimationActive={false} />
      </BarChart>
    </ResponsiveContainer>
  );
}
