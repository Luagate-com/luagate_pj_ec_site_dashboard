// TODO Ch7-7 折れ線グラフ実装
// Recharts (LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer) を
// 使って Figma の折れ線グラフ仕様を実装してください。
// ヒント
// - import { CartesianGrid, Line, LineChart as RechartsLineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
// - ResponsiveContainer で高さ 320px のグラフを描画
// - dataKey={xKey as string} / {yKey as string}
// - 軸ラベル色 "#727270"、グリッド色 "#EFEEE8"
// - tooltip の formatter で formatY を使う

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
  color: _color = "#05B45B",
}: LineChartProps<T>) {
  // TODO 受講生はここを Recharts で書き換えてください
  void data;
  void xKey;
  void yKey;
  void yLabel;
  void formatY;
  return (
    <div className="flex h-[320px] w-full items-center justify-center rounded-lg border border-dashed border-line bg-surface-second text-sm text-ink-sub">
      TODO Ch7-7 Recharts で折れ線グラフを描画する ({data.length} 件のデータ)
    </div>
  );
}
