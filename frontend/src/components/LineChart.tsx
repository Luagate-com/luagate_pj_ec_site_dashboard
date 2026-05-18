import {
  CartesianGrid,
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface LineChartProps<T extends object> {
  data: T[];
  xKey: keyof T;
  yKey: keyof T;
  yLabel?: string;
  formatY?: (value: number) => string;
  color?: string;
}

export function LineChart<T extends object>({
  data,
  xKey,
  yKey,
  yLabel,
  formatY,
  color = "#05B45B",
}: LineChartProps<T>) {
  return (
    <ResponsiveContainer width="100%" height={320}>
      <RechartsLineChart data={data} margin={{ top: 10, right: 16, left: 16, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#EFEEE8" />
        <XAxis dataKey={xKey as string} stroke="#727270" fontSize={12} tickMargin={6} />
        <YAxis
          stroke="#727270"
          fontSize={12}
          tickFormatter={formatY ? (v: number) => formatY(v) : undefined}
          width={70}
        />
        <Tooltip
          formatter={(value: number) => [formatY ? formatY(value) : value.toLocaleString("ja-JP"), yLabel ?? (yKey as string)]}
          contentStyle={{ borderRadius: 8, borderColor: "#DCDCD9", fontSize: 12 }}
        />
        <Line
          type="monotone"
          dataKey={yKey as string}
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
