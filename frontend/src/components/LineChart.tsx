// Ch14 折れ線グラフ
// Recharts (LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer)
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
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data} margin={{ top: 8, right: 24, bottom: 8, left: 8 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#EFEEE8" />
          <XAxis dataKey={xKey as string} tick={{ fill: "#727270", fontSize: 12 }} stroke="#DCDCD9" />
          <YAxis
            tick={{ fill: "#727270", fontSize: 12 }}
            stroke="#DCDCD9"
            tickFormatter={formatY}
            label={yLabel ? { value: yLabel, angle: -90, position: "insideLeft", fill: "#727270", fontSize: 12 } : undefined}
          />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: "1px solid #DCDCD9", fontSize: 12 }}
            formatter={(value: number) => (formatY ? formatY(value) : String(value))}
          />
          <Line
            type="monotone"
            dataKey={yKey as string}
            stroke={color}
            strokeWidth={2}
            dot={{ r: 3, fill: color }}
            activeDot={{ r: 5 }}
          />
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  );
}
