import { Router } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { requireAuth } from "../middleware/auth";

export const dashboardRouter = Router();

// 学習意図のため、ここでは Prisma の集計 API と $queryRaw の両方を使い分けている。
// 受講生は同じ集計を SQL (GROUP BY, SUM, EXTRACT) で書けるようになるのがゴール。

// 全エンドポイント要認証
dashboardRouter.use(requireAuth);

// ===== /api/dashboard/summary =====
// 総売上 / 総注文数 / 客単価 + 増減 + sparkline (直近 6 ヶ月)
//
// 学習材料用の SQL イメージ:
//   SELECT SUM(total) AS revenue, COUNT(*) AS orders FROM orders
//   WHERE EXTRACT(YEAR FROM created_at) = $1;
dashboardRouter.get("/summary", async (_req, res) => {
  // 対象年度は 2025 (seed データに合わせる)。実運用ではクエリ or 現在年。
  const year = 2025;
  const prevYear = year - 1;

  // 当年集計
  const currentAgg = await prisma.$queryRaw<Array<{ revenue: bigint | null; orders: bigint }>>`
    SELECT
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint AS orders
    FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = ${year}
  `;
  const prevAgg = await prisma.$queryRaw<Array<{ revenue: bigint | null; orders: bigint }>>`
    SELECT
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint AS orders
    FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = ${prevYear}
  `;

  const currentRevenue = Number(currentAgg[0]?.revenue ?? 0);
  const currentOrders = Number(currentAgg[0]?.orders ?? 0);
  const prevRevenue = Number(prevAgg[0]?.revenue ?? 0);
  const prevOrders = Number(prevAgg[0]?.orders ?? 0);

  // 客単価は seed データの規模に合わせて算出
  const currentAov = currentOrders > 0 ? Math.round(currentRevenue / currentOrders) : 0;
  const prevAov = prevOrders > 0 ? Math.round(prevRevenue / prevOrders) : 0;

  // 直近 6 ヶ月の sparkline (現在年の 7-12 月、または最新 6 ヶ月)
  const sparklineMonths = await prisma.$queryRaw<Array<{ month: Date; revenue: bigint | null; orders: bigint }>>`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint AS orders
    FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = ${year}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  `;

  const revenueSparkline = sparklineMonths.slice(-6).map((m) => Number(m.revenue ?? 0));
  const ordersSparkline = sparklineMonths.slice(-6).map((m) => Number(m.orders));
  const aovSparkline = sparklineMonths.slice(-6).map((m) => {
    const r = Number(m.revenue ?? 0);
    const o = Number(m.orders);
    return o > 0 ? Math.round(r / o) : 0;
  });

  res.json({
    updatedAt: new Date().toISOString(),
    revenue: {
      current: currentRevenue,
      previous: prevRevenue,
      delta: currentRevenue - prevRevenue,
      sparkline: revenueSparkline,
    },
    orders: {
      current: currentOrders,
      previous: prevOrders,
      delta: currentOrders - prevOrders,
      sparkline: ordersSparkline,
    },
    aov: {
      current: currentAov,
      previous: prevAov,
      delta: currentAov - prevAov,
      sparkline: aovSparkline,
    },
  });
});

// ===== /api/dashboard/monthly =====
// 月別売上推移 (GROUP BY DATE_TRUNC('month', ...))
const monthlyQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(2025),
});

dashboardRouter.get("/monthly", async (req, res) => {
  const parsed = monthlyQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year } = parsed.data;

  const rows = await prisma.$queryRaw<Array<{ month: Date; revenue: bigint | null; orders: bigint }>>`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint AS orders
    FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = ${year}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  `;

  // 12 ヶ月分にパディング (データの無い月は 0)
  const monthly: Array<{ month: string; label: string; revenue: number; orders: number }> = [];
  for (let m = 0; m < 12; m++) {
    const row = rows.find((r) => new Date(r.month).getMonth() === m);
    monthly.push({
      month: `${year}-${String(m + 1).padStart(2, "0")}`,
      label: `${m + 1}月`,
      revenue: row ? Number(row.revenue ?? 0) : 0,
      orders: row ? Number(row.orders) : 0,
    });
  }

  res.json({ year, monthly });
});

// ===== /api/dashboard/weekly =====
// 週別売上推移 (指定月内)
const weeklyQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM").default("2025-12"),
});

dashboardRouter.get("/weekly", async (req, res) => {
  const parsed = weeklyQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { month } = parsed.data;
  const [yearStr, monthStr] = month.split("-");
  const year = Number(yearStr);
  const monthNum = Number(monthStr);

  const start = new Date(year, monthNum - 1, 1);
  const end = new Date(year, monthNum, 1);

  const rows = await prisma.$queryRaw<Array<{ week: Date; revenue: bigint | null; orders: bigint }>>`
    SELECT
      DATE_TRUNC('week', created_at) AS week,
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint AS orders
    FROM orders
    WHERE created_at >= ${start} AND created_at < ${end}
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY week
  `;

  const weekly = rows.map((r, idx) => ({
    week: new Date(r.week).toISOString().slice(0, 10),
    label: `第${idx + 1}週`,
    revenue: Number(r.revenue ?? 0),
    orders: Number(r.orders),
  }));

  res.json({ month, weekly });
});

// ===== /api/dashboard/products/sales-ranking =====
// 商品売上 TOP 10 (SUM(quantity * unit_price))
const productRankingQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(2025),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

dashboardRouter.get("/products/sales-ranking", async (req, res) => {
  const parsed = productRankingQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year, limit } = parsed.data;

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    category: string;
    revenue: bigint | null;
    units: bigint;
  }>>`
    SELECT
      p.id,
      p.name,
      p.category,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0)::bigint AS revenue,
      COALESCE(SUM(oi.quantity), 0)::bigint AS units
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE EXTRACT(YEAR FROM o.created_at) = ${year}
    GROUP BY p.id, p.name, p.category
    ORDER BY revenue DESC
    LIMIT ${limit}
  `;

  res.json({
    year,
    ranking: rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      revenue: Number(r.revenue ?? 0),
      units: Number(r.units),
    })),
  });
});

// ===== /api/dashboard/products/order-ranking =====
// 商品注文数 TOP 10 (SUM(quantity))
dashboardRouter.get("/products/order-ranking", async (req, res) => {
  const parsed = productRankingQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year, limit } = parsed.data;

  const rows = await prisma.$queryRaw<Array<{
    id: string;
    name: string;
    category: string;
    units: bigint;
    revenue: bigint | null;
  }>>`
    SELECT
      p.id,
      p.name,
      p.category,
      COALESCE(SUM(oi.quantity), 0)::bigint AS units,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0)::bigint AS revenue
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE EXTRACT(YEAR FROM o.created_at) = ${year}
    GROUP BY p.id, p.name, p.category
    ORDER BY units DESC
    LIMIT ${limit}
  `;

  // 月別の注文数推移 (折れ線用)
  const monthlyOrders = await prisma.$queryRaw<Array<{ month: Date; orders: bigint }>>`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      COUNT(*)::bigint AS orders
    FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = ${year}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  `;
  const monthly: Array<{ month: string; label: string; orders: number }> = [];
  for (let m = 0; m < 12; m++) {
    const row = monthlyOrders.find((r) => new Date(r.month).getMonth() === m);
    monthly.push({
      month: `${year}-${String(m + 1).padStart(2, "0")}`,
      label: `${m + 1}月`,
      orders: row ? Number(row.orders) : 0,
    });
  }

  res.json({
    year,
    monthly,
    ranking: rows.map((r) => ({
      id: r.id,
      name: r.name,
      category: r.category,
      units: Number(r.units),
      revenue: Number(r.revenue ?? 0),
    })),
  });
});

// ===== /api/dashboard/categories =====
// カテゴリ別売上シェア + 客単価
const categoryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(2025),
});

dashboardRouter.get("/categories", async (req, res) => {
  const parsed = categoryQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year } = parsed.data;

  // カテゴリ別の売上・客単価 (注文数で割る)
  const categoryRows = await prisma.$queryRaw<Array<{
    category: string;
    revenue: bigint | null;
    units: bigint;
    order_count: bigint;
  }>>`
    SELECT
      p.category,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0)::bigint AS revenue,
      COALESCE(SUM(oi.quantity), 0)::bigint AS units,
      COUNT(DISTINCT o.id)::bigint AS order_count
    FROM order_items oi
    JOIN products p ON oi.product_id = p.id
    JOIN orders o ON oi.order_id = o.id
    WHERE EXTRACT(YEAR FROM o.created_at) = ${year}
    GROUP BY p.category
    ORDER BY revenue DESC
  `;

  const totalRevenue = categoryRows.reduce((sum, r) => sum + Number(r.revenue ?? 0), 0);
  const categories = categoryRows.map((r) => {
    const revenue = Number(r.revenue ?? 0);
    const orders = Number(r.order_count);
    return {
      category: r.category,
      revenue,
      units: Number(r.units),
      orderCount: orders,
      averageOrderValue: orders > 0 ? Math.round(revenue / orders) : 0,
      share: totalRevenue > 0 ? Math.round((revenue / totalRevenue) * 1000) / 10 : 0, // 小数1桁
    };
  });

  // 全体平均客単価
  const totalAgg = await prisma.$queryRaw<Array<{ revenue: bigint | null; orders: bigint }>>`
    SELECT
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint AS orders
    FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = ${year}
  `;
  const overallRevenue = Number(totalAgg[0]?.revenue ?? 0);
  const overallOrders = Number(totalAgg[0]?.orders ?? 0);
  const overallAov = overallOrders > 0 ? Math.round(overallRevenue / overallOrders) : 0;

  // 月別客単価推移 (折れ線用)
  const monthlyAov = await prisma.$queryRaw<Array<{ month: Date; revenue: bigint | null; orders: bigint }>>`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint AS orders
    FROM orders
    WHERE EXTRACT(YEAR FROM created_at) = ${year}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month
  `;
  const monthly: Array<{ month: string; label: string; aov: number }> = [];
  for (let m = 0; m < 12; m++) {
    const row = monthlyAov.find((r) => new Date(r.month).getMonth() === m);
    const r = row ? Number(row.revenue ?? 0) : 0;
    const o = row ? Number(row.orders) : 0;
    monthly.push({
      month: `${year}-${String(m + 1).padStart(2, "0")}`,
      label: `${m + 1}月`,
      aov: o > 0 ? Math.round(r / o) : 0,
    });
  }

  res.json({
    year,
    overallAov,
    monthly,
    categories,
  });
});
