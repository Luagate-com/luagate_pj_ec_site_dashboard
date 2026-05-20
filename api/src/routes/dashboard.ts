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

  // Ch11 月別集計
  // EXTRACT(MONTH FROM created_at) で月番号を取り出してグループ化、SUM(total)/COUNT(*)
  const rows = await prisma.$queryRaw<Array<{ m: number; revenue: bigint; orders: bigint }>>`
    SELECT
      EXTRACT(MONTH FROM created_at)::int AS m,
      COALESCE(SUM(total), 0)::bigint     AS revenue,
      COUNT(*)::bigint                    AS orders
    FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = ${year}
    GROUP BY 1
    ORDER BY 1;
  `;

  // 12 ヶ月分にパディング (データの無い月は revenue=0, orders=0)
  const byMonth = new Map(rows.map((r) => [r.m, r]));
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const r = byMonth.get(i + 1);
    return {
      month: `${year}-${String(i + 1).padStart(2, "0")}`,
      label: `${i + 1}月`,
      revenue: r ? Number(r.revenue) : 0,
      orders: r ? Number(r.orders) : 0,
    };
  });

  return res.json({ year, monthly });
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

  // Ch12 週別集計
  // 対象月の開始 / 終了日を計算し、DATE_TRUNC('week', created_at) で週単位グループ化
  const [yStr, mStr] = month.split("-");
  const yNum = Number(yStr);
  const mNum = Number(mStr);
  const start = new Date(Date.UTC(yNum, mNum - 1, 1));
  const end = new Date(Date.UTC(yNum, mNum, 1));

  const rows = await prisma.$queryRaw<Array<{ week: Date; revenue: bigint; orders: bigint }>>`
    SELECT
      DATE_TRUNC('week', created_at)::date AS week,
      COALESCE(SUM(total), 0)::bigint       AS revenue,
      COUNT(DISTINCT id)::bigint            AS orders
    FROM orders
    WHERE created_at >= ${start} AND created_at < ${end}
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY DATE_TRUNC('week', created_at);
  `;

  const weekly = rows.map((r, idx) => ({
    week: r.week.toISOString().slice(0, 10),
    label: `第${idx + 1}週`,
    revenue: Number(r.revenue),
    orders: Number(r.orders),
  }));

  return res.json({ month, weekly });
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

  // Ch12 商品売上ランキング
  // order_items × products × orders を JOIN し SUM(quantity * unit_price) で集計
  const ranking = await prisma.$queryRaw<
    Array<{ id: string; name: string; category: string; revenue: bigint; units: bigint }>
  >`
    SELECT
      p.id                                       AS id,
      p.name                                     AS name,
      p.category                                 AS category,
      SUM(oi.quantity * oi.unit_price)::bigint   AS revenue,
      SUM(oi.quantity)::bigint                   AS units
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders   o ON o.id = oi.order_id
    WHERE EXTRACT(YEAR FROM o.created_at) = ${year}
    GROUP BY p.id, p.name, p.category
    ORDER BY revenue DESC
    LIMIT ${limit};
  `;

  return res.json({
    year,
    limit,
    ranking: ranking.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      revenue: Number(r.revenue),
      units: Number(r.units),
    })),
  });
});

// ===== /api/dashboard/products/order-ranking =====
// Ch12: 商品注文数ランキング (SUM(quantity))
dashboardRouter.get("/products/order-ranking", async (req, res) => {
  const parsed = productRankingQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year, limit } = parsed.data;

  // Ch12 商品注文数ランキング
  // 売上ランキングと同じ JOIN だが ORDER BY units DESC
  // units は「商品が登場した注文数」を COUNT(DISTINCT o.id) で数える
  const ranking = await prisma.$queryRaw<
    Array<{ id: string; name: string; category: string; units: bigint; revenue: bigint }>
  >`
    SELECT
      p.id                                       AS id,
      p.name                                     AS name,
      p.category                                 AS category,
      COUNT(DISTINCT o.id)::bigint               AS units,
      SUM(oi.quantity * oi.unit_price)::bigint   AS revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders   o ON o.id = oi.order_id
    WHERE EXTRACT(YEAR FROM o.created_at) = ${year}
    GROUP BY p.id, p.name, p.category
    ORDER BY units DESC, revenue DESC
    LIMIT ${limit};
  `;

  // 折れ線用の monthly[] (月別注文数)
  const monthlyRows = await prisma.$queryRaw<Array<{ m: number; orders: bigint }>>`
    SELECT
      EXTRACT(MONTH FROM created_at)::int AS m,
      COUNT(*)::bigint                    AS orders
    FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = ${year}
    GROUP BY 1
    ORDER BY 1;
  `;
  const byMonth = new Map(monthlyRows.map((r) => [r.m, Number(r.orders)]));
  const monthly = Array.from({ length: 12 }, (_, i) => ({
    month: `${year}-${String(i + 1).padStart(2, "0")}`,
    label: `${i + 1}月`,
    orders: byMonth.get(i + 1) ?? 0,
  }));

  return res.json({
    year,
    limit,
    monthly,
    ranking: ranking.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      units: Number(r.units),
      revenue: Number(r.revenue),
    })),
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

  // Ch12 カテゴリ集計
  // p.category で GROUP BY、Window Function SUM(...) OVER () で全体売上に対するシェアを算出
  const catRows = await prisma.$queryRaw<
    Array<{
      category: string;
      revenue: bigint;
      units: bigint;
      order_count: bigint;
      share: number;
    }>
  >`
    SELECT
      p.category                                 AS category,
      SUM(oi.quantity * oi.unit_price)::bigint   AS revenue,
      SUM(oi.quantity)::bigint                   AS units,
      COUNT(DISTINCT o.id)::bigint               AS order_count,
      ROUND(
        SUM(oi.quantity * oi.unit_price)::numeric * 100.0
        / NULLIF(SUM(SUM(oi.quantity * oi.unit_price)) OVER (), 0),
        1
      )::float                                   AS share
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders   o ON o.id = oi.order_id
    WHERE EXTRACT(YEAR FROM o.created_at) = ${year}
    GROUP BY p.category
    ORDER BY revenue DESC;
  `;

  // 全体 AOV は orders テーブルから直接集計する (Ch12 の :::bad/:::good 参照)。
  // カテゴリ別の orderCount を足し合わせると、1 注文が複数カテゴリにまたがる場合に
  // 注文が重複カウントされ AOV が過小になる。必ず注文を一意に数えられる orders で出す。
  const overallRows = await prisma.$queryRaw<Array<{ revenue: bigint; orders: bigint }>>`
    SELECT
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint               AS orders
    FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = ${year};
  `;
  const overall = overallRows[0] ?? { revenue: 0n, orders: 0n };
  const overallRevenue = Number(overall.revenue);
  const overallOrders = Number(overall.orders);
  const overallAov = overallOrders > 0 ? Math.round(overallRevenue / overallOrders) : 0;

  // 月別客単価 monthly[] (revenue / orders) — これも orders 直接集計
  const monthlyRows = await prisma.$queryRaw<Array<{ m: number; revenue: bigint; orders: bigint }>>`
    SELECT
      EXTRACT(MONTH FROM created_at)::int AS m,
      COALESCE(SUM(total), 0)::bigint     AS revenue,
      COUNT(*)::bigint                    AS orders
    FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = ${year}
    GROUP BY 1
    ORDER BY 1;
  `;
  const byMonth = new Map(monthlyRows.map((r) => [r.m, r]));
  const monthly = Array.from({ length: 12 }, (_, i) => {
    const r = byMonth.get(i + 1);
    const rev = r ? Number(r.revenue) : 0;
    const ord = r ? Number(r.orders) : 0;
    return {
      month: `${year}-${String(i + 1).padStart(2, "0")}`,
      label: `${i + 1}月`,
      aov: ord > 0 ? Math.round(rev / ord) : 0,
    };
  });

  const categories = catRows.map((r) => {
    const revenue = Number(r.revenue);
    const orderCount = Number(r.order_count);
    return {
      category: r.category,
      revenue,
      units: Number(r.units),
      orderCount,
      // カテゴリ単位の AOV は「そのカテゴリの商品が含まれる注文数」で割る。
      // これはカテゴリ指標としては正しいが、全体 AOV の算出には使わない。
      averageOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
      share: r.share ?? 0,
    };
  });

  return res.json({ year, overallAov, monthly, categories });
});
