// Ch14 折れ線グラフ
// Recharts で売上推移などの時系列データを折れ線で描画する。
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
      <RechartsLineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
        <CartesianGrid stroke="#EFEEE8" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey={xKey as string}
          stroke="#727270"
          fontSize={12}
          tickLine={false}
          axisLine={{ stroke: "#EFEEE8" }}
        />
        <YAxis
          stroke="#727270"
          fontSize={12}
          tickLine={false}
          axisLine={false}
          width={64}
          tickFormatter={formatY ? (v: number) => formatY(v) : undefined}
        />
        <Tooltip
          formatter={(value: number) => [formatY ? formatY(value) : value, yLabel ?? (yKey as string)]}
        />
        <Line
          type="monotone"
          dataKey={yKey as string}
          name={yLabel ?? (yKey as string)}
          stroke={color}
          strokeWidth={2.5}
          dot={{ r: 3, fill: color }}
          activeDot={{ r: 5 }}
        />
      </RechartsLineChart>
    </ResponsiveContainer>
  );
}
