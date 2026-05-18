import { Bar, BarChart, Line, LineChart, ResponsiveContainer } from "recharts";

interface SparklineProps {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color = "#05B45B" }: SparklineProps) {
  const points = data.map((value, idx) => ({ idx, value }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <Line type="monotone" dataKey="value" stroke={color} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
}

interface MiniBarChartProps {
  data: number[];
  color?: string;
}

export function MiniBarChart({ data, color = "#05B45B" }: MiniBarChartProps) {
  const points = data.map((value, idx) => ({ idx, value }));
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={points} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}
