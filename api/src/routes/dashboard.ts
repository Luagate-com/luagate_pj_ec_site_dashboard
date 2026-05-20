import { Router } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { requireAuth } from "../middleware/auth";

export const dashboardRouter = Router();

// 受講生向けメモ
// このファイルは Ch10 〜 Ch12 で順番に埋めていく集計 API のスケルトンです。
// `prisma.$queryRaw` を使って PostgreSQL の集計関数 (SUM, COUNT, DATE_TRUNC, EXTRACT,
// GROUP BY, JOIN) を書きながら、SQL の引き出しを増やすのがゴールです。
// 各エンドポイントには TODO コメントとヒント、戻り値のダミーが用意されているので、
// 1 章ずつ動作確認 (curl) しながら進めてください。

// 全エンドポイント要認証
dashboardRouter.use(requireAuth);

// ===== /api/dashboard/summary =====
// Ch10: KPI 集計 API
// 総売上 / 総注文数 / 客単価 + 前年比増減 + 直近 6 ヶ月の sparkline を返す。
//
// 教材 Ch10 の $queryRaw + 集計関数パターンを写経。
// 実 Prisma schema に合わせて orders.total / orders.created_at を使う。
const summaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(2025),
});

type AggRow = { total_revenue: bigint; order_count: bigint };
type SparkRow = { month: Date; revenue: bigint; orders: bigint };

dashboardRouter.get("/summary", async (req, res) => {
  const parsed = summaryQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year } = parsed.data;

  // 1) 当年・前年の総売上 / 総注文数を $queryRaw で集計
  const aggregate = (y: number) =>
    prisma.$queryRaw<AggRow[]>`
      SELECT
        COALESCE(SUM(total), 0)::bigint AS total_revenue,
        COUNT(*)::bigint               AS order_count
      FROM orders
      WHERE EXTRACT(YEAR FROM created_at) = ${y};
    `;

  // 3) sparkline 用に当年の月別売上 / 注文数を集計し、直近 6 ヶ月を抜き出す
  const [curRows, prevRows, sparkRows] = await Promise.all([
    aggregate(year),
    aggregate(year - 1),
    prisma.$queryRaw<SparkRow[]>`
      SELECT
        DATE_TRUNC('month', created_at) AS month,
        COALESCE(SUM(total), 0)::bigint AS revenue,
        COUNT(*)::bigint               AS orders
      FROM orders
      WHERE EXTRACT(YEAR FROM created_at) = ${year}
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month;
    `,
  ]);

  const cur = curRows[0] ?? { total_revenue: 0n, order_count: 0n };
  const prev = prevRows[0] ?? { total_revenue: 0n, order_count: 0n };

  const revenueSpark = sparkRows.slice(-6).map((r) => Number(r.revenue));
  const ordersSpark = sparkRows.slice(-6).map((r) => Number(r.orders));
  const aovSpark = sparkRows.slice(-6).map((r) => {
    const rev = Number(r.revenue);
    const ord = Number(r.orders);
    return ord > 0 ? Math.round(rev / ord) : 0;
  });

  // 4) AOV (客単価) = 売上 / 注文数。0 除算に注意
  const buildKpi = (current: number, previous: number, sparkline: number[]) => ({
    current,
    previous,
    delta: current - previous,
    sparkline,
  });

  const curRevenue = Number(cur.total_revenue);
  const curOrders = Number(cur.order_count);
  const prevRevenue = Number(prev.total_revenue);
  const prevOrders = Number(prev.order_count);
  const curAov = curOrders > 0 ? Math.round(curRevenue / curOrders) : 0;
  const prevAov = prevOrders > 0 ? Math.round(prevRevenue / prevOrders) : 0;

  res.json({
    updatedAt: new Date().toISOString(),
    revenue: buildKpi(curRevenue, prevRevenue, revenueSpark),
    orders: buildKpi(curOrders, prevOrders, ordersSpark),
    aov: buildKpi(curAov, prevAov, aovSpark),
  });
});

// ===== /api/dashboard/monthly =====
// Ch11: 月次売上 API (GROUP BY DATE_TRUNC('month', ...))
const monthlyQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(2025),
});

dashboardRouter.get("/monthly", async (req, res) => {
  const parsed = monthlyQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year } = parsed.data;

  // TODO Ch11 月別集計
  // ヒント
  // - DATE_TRUNC('month', created_at) で月単位グループ化
  // - SUM(total) で売上、COUNT(*) で注文数
  // - 12 ヶ月分にパディング (データの無い月は revenue=0, orders=0)
  // - 戻り値の monthly[].month は "YYYY-MM" 形式、label は "1月" のような表記
  const monthly = Array.from({ length: 12 }, (_, m) => ({
    month: `${year}-${String(m + 1).padStart(2, "0")}`,
    label: `${m + 1}月`,
    revenue: 0,
    orders: 0,
  }));

  return res.status(501).json({
    error: "Not implemented yet — see chapter 11 (/api/dashboard/monthly)",
    year,
    monthly,
  });
});

// ===== /api/dashboard/weekly =====
// Ch12: 週次・商品ランキング・カテゴリ集計 API (週次パート)
const weeklyQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM").default("2025-12"),
});

dashboardRouter.get("/weekly", async (req, res) => {
  const parsed = weeklyQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { month } = parsed.data;

  // TODO Ch12 週別集計
  // ヒント
  // - 対象月の開始 / 終了日を計算 (例 new Date(year, monthNum - 1, 1) と new Date(year, monthNum, 1))
  // - DATE_TRUNC('week', created_at) で週単位グループ化
  // - WHERE created_at >= $start AND created_at < $end
  // - 戻り値の week は "YYYY-MM-DD"、label は "第N週"
  return res.status(501).json({
    error: "Not implemented yet — see chapter 12 (/api/dashboard/weekly)",
    month,
    weekly: [] as Array<{ week: string; label: string; revenue: number; orders: number }>,
  });
});

// ===== /api/dashboard/products/sales-ranking =====
// Ch12: 商品売上ランキング (SUM(quantity * unit_price))
const productRankingQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(2025),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

dashboardRouter.get("/products/sales-ranking", async (req, res) => {
  const parsed = productRankingQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year, limit } = parsed.data;

  // TODO Ch12 商品売上ランキング
  // ヒント
  // - order_items と products / orders を JOIN
  // - SUM(oi.quantity * oi.unit_price) を revenue として集計
  // - GROUP BY p.id, p.name, p.category
  // - ORDER BY revenue DESC LIMIT $limit
  return res.status(501).json({
    error: "Not implemented yet — see chapter 12 (/api/dashboard/products/sales-ranking)",
    year,
    limit,
    ranking: [] as Array<{ id: string; name: string; category: string; revenue: number; units: number }>,
  });
});

// ===== /api/dashboard/products/order-ranking =====
// Ch12: 商品注文数ランキング (SUM(quantity))
dashboardRouter.get("/products/order-ranking", async (req, res) => {
  const parsed = productRankingQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year, limit } = parsed.data;

  // TODO Ch12 商品注文数ランキング
  // ヒント
  // - 売上ランキングと似た JOIN だが ORDER BY units DESC
  // - 折れ線用の monthly[] (月別注文数) も別途集計する
  const monthly = Array.from({ length: 12 }, (_, m) => ({
    month: `${year}-${String(m + 1).padStart(2, "0")}`,
    label: `${m + 1}月`,
    orders: 0,
  }));

  return res.status(501).json({
    error: "Not implemented yet — see chapter 12 (/api/dashboard/products/order-ranking)",
    year,
    limit,
    monthly,
    ranking: [] as Array<{ id: string; name: string; category: string; units: number; revenue: number }>,
  });
});

// ===== /api/dashboard/categories =====
// Ch12: カテゴリ別売上シェア + 客単価 (Window Function を使う余地あり)
const categoryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(2025),
});

dashboardRouter.get("/categories", async (req, res) => {
  const parsed = categoryQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year } = parsed.data;

  // TODO Ch12 カテゴリ集計
  // ヒント
  // - p.category で GROUP BY
  // - SUM(oi.quantity * oi.unit_price) を revenue、COUNT(DISTINCT o.id) を order_count
  // - share = revenue / SUM(revenue) を計算 (合計売上は別クエリ or Window Function)
  // - 月別客単価 monthly[] (revenue / orders) も併せて返す
  const monthly = Array.from({ length: 12 }, (_, m) => ({
    month: `${year}-${String(m + 1).padStart(2, "0")}`,
    label: `${m + 1}月`,
    aov: 0,
  }));

  return res.status(501).json({
    error: "Not implemented yet — see chapter 12 (/api/dashboard/categories)",
    year,
    overallAov: 0,
    monthly,
    categories: [] as Array<{
      category: string;
      revenue: number;
      units: number;
      orderCount: number;
      averageOrderValue: number;
      share: number;
    }>,
  });
});
