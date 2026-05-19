// TODO Ch7-6 / Ch7-7 ミニグラフ (Sparkline / MiniBarChart)
// KPI カード内に埋め込む小さな折れ線・棒グラフです。
// ヒント
// - import { Bar, BarChart, Line, LineChart, ResponsiveContainer } from "recharts";
// - axis やグリッドは描画しない (dot={false}, 余白小さめ)
// - data: number[] を {idx, value}[] に変換して dataKey="value"

interface SparklineProps {
  data: number[];
  color?: string;
}

export function Sparkline({ data, color: _color = "#05B45B" }: SparklineProps) {
  // TODO 受講生はここを Recharts の LineChart で書き換えてください
  return (
    <div className="flex h-full w-full items-center justify-center text-xs text-ink-sub">
      TODO Sparkline ({data.length} pts)
    </div>
  );
}

interface MiniBarChartProps {
  data: number[];
  color?: string;
}

export function MiniBarChart({ data, color: _color = "#05B45B" }: MiniBarChartProps) {
  // TODO 受講生はここを Recharts の BarChart で書き換えてください
  return (
    <div className="flex h-full w-full items-center justify-center text-xs text-ink-sub">
      TODO MiniBarChart ({data.length} pts)
    </div>
  );
}
