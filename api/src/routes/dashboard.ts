import { Router } from "express";
import { z } from "zod";
import { prisma } from "../index";
import { requireAuth } from "../middleware/auth";

export const dashboardRouter = Router();

// 受講生向けメモ
// このファイルは Ch7-3 〜 Ch7-5 で順番に埋めていく集計 API のスケルトンです。
// `prisma.$queryRaw` を使って PostgreSQL の集計関数 (SUM, COUNT, DATE_TRUNC, EXTRACT,
// GROUP BY, JOIN) を書きながら、SQL の引き出しを増やすのがゴールです。
// 各エンドポイントには TODO コメントとヒント、戻り値のダミーが用意されているので、
// 1 章ずつ動作確認 (curl) しながら進めてください。

// 全エンドポイント要認証
dashboardRouter.use(requireAuth);

// ===== 共通: KPI / sparkline 集計関数 =====
// Ch10 の Step 3 に倣って $queryRaw で SUM / COUNT / AVG を集計。
// PostgreSQL の SUM/COUNT は bigint で返ってくるため Number() でラップする。

interface RawAgg {
  total_revenue: bigint | number;
  order_count: bigint | number;
  average_order_value: number;
}

interface RawMonth {
  month: Date;
  revenue: bigint | number;
  orders: bigint | number;
}

async function aggregateRange(from: Date, to: Date): Promise<RawAgg> {
  const rows = await prisma.$queryRaw<RawAgg[]>`
    SELECT
      COALESCE(SUM(total), 0)::bigint AS total_revenue,
      COUNT(*)::bigint                AS order_count,
      COALESCE(AVG(total), 0)::float  AS average_order_value
    FROM orders
    WHERE created_at >= ${from}
      AND created_at <  ${to};
  `;
  return rows[0] ?? { total_revenue: 0n, order_count: 0n, average_order_value: 0 };
}

async function monthlySparkline(from: Date, to: Date): Promise<RawMonth[]> {
  return prisma.$queryRaw<RawMonth[]>`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint                AS orders
    FROM orders
    WHERE created_at >= ${from}
      AND created_at <  ${to}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month;
  `;
}

function buildKpi(curRaw: bigint | number, prevRaw: bigint | number, spark: number[]) {
  const current = Number(curRaw);
  const previous = Number(prevRaw);
  return {
    current: Math.round(current),
    previous: Math.round(previous),
    delta: Math.round(current - previous),
    sparkline: spark,
  };
}

// ===== /api/dashboard/summary =====
// Ch10 (旧 Ch7-3): KPI 集計 API
// 総売上 / 総注文数 / 客単価 + 前年比増減 + 直近 6 ヶ月の sparkline を返す。
const summaryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(2025),
});

dashboardRouter.get("/summary", async (req, res) => {
  const parsed = summaryQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year } = parsed.data;

  // 比較しやすいよう「当年 1/1 〜 翌年 1/1」「前年 1/1 〜 当年 1/1」のレンジで集計。
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));
  const prevFrom = new Date(Date.UTC(year - 1, 0, 1));
  const prevTo = new Date(Date.UTC(year, 0, 1));

  // 当年 (year) の最終 6 ヶ月 (7〜12 月) を sparkline として返す。
  const sparkFrom = new Date(Date.UTC(year, 6, 1));
  const sparkTo = new Date(Date.UTC(year + 1, 0, 1));

  const [current, previous, monthly] = await Promise.all([
    aggregateRange(from, to),
    aggregateRange(prevFrom, prevTo),
    monthlySparkline(sparkFrom, sparkTo),
  ]);

  // 6 ヶ月分にパディング (空月は 0)
  const monthlyByKey = new Map<string, RawMonth>();
  for (const m of monthly) {
    const d = new Date(m.month);
    monthlyByKey.set(`${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`, m);
  }
  const padded = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(Date.UTC(year, 6 + i, 1));
    const key = `${d.getUTCFullYear()}-${d.getUTCMonth() + 1}`;
    const row = monthlyByKey.get(key);
    return {
      revenue: row ? Number(row.revenue) : 0,
      orders: row ? Number(row.orders) : 0,
    };
  });

  const revenue = buildKpi(current.total_revenue, previous.total_revenue, padded.map((m) => m.revenue));
  const orders = buildKpi(current.order_count, previous.order_count, padded.map((m) => m.orders));
  const aov = buildKpi(
    current.average_order_value,
    previous.average_order_value,
    padded.map((m) => (m.orders > 0 ? Math.round(m.revenue / m.orders) : 0)),
  );

  res.json({
    updatedAt: new Date().toISOString(),
    revenue,
    orders,
    aov,
  });
});

// ===== /api/dashboard/monthly =====
// Ch7-4: 月次売上 API (GROUP BY DATE_TRUNC('month', ...))
const monthlyQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(2025),
});

dashboardRouter.get("/monthly", async (req, res) => {
  const parsed = monthlyQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year } = parsed.data;

  // Ch11 月別集計
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));
  const rows = await prisma.$queryRaw<RawMonth[]>`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint                AS orders
    FROM orders
    WHERE created_at >= ${from}
      AND created_at <  ${to}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month;
  `;

  const byKey = new Map<number, RawMonth>();
  for (const r of rows) {
    const d = new Date(r.month);
    byKey.set(d.getUTCMonth(), r);
  }
  const monthly = Array.from({ length: 12 }, (_, m) => {
    const row = byKey.get(m);
    return {
      month: `${year}-${String(m + 1).padStart(2, "0")}`,
      label: `${m + 1}月`,
      revenue: row ? Number(row.revenue) : 0,
      orders: row ? Number(row.orders) : 0,
    };
  });

  return res.json({ year, monthly });
});

// ===== /api/dashboard/weekly =====
// Ch7-5: 週次・商品ランキング・カテゴリ集計 API (週次パート)
const weeklyQuerySchema = z.object({
  month: z.string().regex(/^\d{4}-\d{2}$/, "YYYY-MM").default("2025-12"),
});

dashboardRouter.get("/weekly", async (req, res) => {
  const parsed = weeklyQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { month } = parsed.data;

  // Ch12 週別集計
  const [y, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));

  interface RawWeek {
    week: Date;
    revenue: bigint | number;
    orders: bigint | number;
  }
  const rows = await prisma.$queryRaw<RawWeek[]>`
    SELECT
      DATE_TRUNC('week', created_at) AS week,
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint                AS orders
    FROM orders
    WHERE created_at >= ${start}
      AND created_at <  ${end}
    GROUP BY DATE_TRUNC('week', created_at)
    ORDER BY week;
  `;

  const weekly = rows.map((r, i) => {
    const d = new Date(r.week);
    const iso = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
    return {
      week: iso,
      label: `第${i + 1}週`,
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    };
  });

  return res.json({ month, weekly });
});

// ===== /api/dashboard/products/sales-ranking =====
// Ch7-5: 商品売上ランキング (SUM(quantity * unit_price))
const productRankingQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(2025),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

dashboardRouter.get("/products/sales-ranking", async (req, res) => {
  const parsed = productRankingQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year, limit } = parsed.data;

  // Ch12 商品売上ランキング
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));
  interface RawProductRanking {
    id: string;
    name: string;
    category: string;
    revenue: bigint | number;
    units: bigint | number;
  }
  const rows = await prisma.$queryRaw<RawProductRanking[]>`
    SELECT
      p.id,
      p.name,
      p.category,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0)::bigint AS revenue,
      COALESCE(SUM(oi.quantity), 0)::bigint                 AS units
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders   o ON o.id = oi.order_id
    WHERE o.created_at >= ${from}
      AND o.created_at <  ${to}
    GROUP BY p.id, p.name, p.category
    ORDER BY revenue DESC
    LIMIT ${limit};
  `;

  const ranking = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    revenue: Number(r.revenue),
    units: Number(r.units),
  }));

  return res.json({ year, limit, ranking });
});

// ===== /api/dashboard/products/order-ranking =====
// Ch7-5: 商品注文数ランキング (SUM(quantity))
dashboardRouter.get("/products/order-ranking", async (req, res) => {
  const parsed = productRankingQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year, limit } = parsed.data;

  // Ch12 商品注文数ランキング (units DESC) + 月別注文数推移
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));

  interface RawProductRanking {
    id: string;
    name: string;
    category: string;
    units: bigint | number;
    revenue: bigint | number;
  }
  const rows = await prisma.$queryRaw<RawProductRanking[]>`
    SELECT
      p.id,
      p.name,
      p.category,
      COALESCE(SUM(oi.quantity), 0)::bigint                 AS units,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0)::bigint AS revenue
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders   o ON o.id = oi.order_id
    WHERE o.created_at >= ${from}
      AND o.created_at <  ${to}
    GROUP BY p.id, p.name, p.category
    ORDER BY units DESC
    LIMIT ${limit};
  `;

  interface RawMonthlyOrders {
    month: Date;
    orders: bigint | number;
  }
  const monthlyRows = await prisma.$queryRaw<RawMonthlyOrders[]>`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      COUNT(*)::bigint                AS orders
    FROM orders
    WHERE created_at >= ${from}
      AND created_at <  ${to}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month;
  `;
  const ordersByMonth = new Map<number, number>();
  for (const r of monthlyRows) ordersByMonth.set(new Date(r.month).getUTCMonth(), Number(r.orders));

  const monthly = Array.from({ length: 12 }, (_, m) => ({
    month: `${year}-${String(m + 1).padStart(2, "0")}`,
    label: `${m + 1}月`,
    orders: ordersByMonth.get(m) ?? 0,
  }));

  const ranking = rows.map((r) => ({
    id: r.id,
    name: r.name,
    category: r.category,
    units: Number(r.units),
    revenue: Number(r.revenue),
  }));

  return res.json({ year, limit, monthly, ranking });
});

// ===== /api/dashboard/categories =====
// Ch7-5: カテゴリ別売上シェア + 客単価 (Window Function を使う余地あり)
const categoryQuerySchema = z.object({
  year: z.coerce.number().int().min(2000).max(2100).default(2025),
});

dashboardRouter.get("/categories", async (req, res) => {
  const parsed = categoryQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year } = parsed.data;

  // Ch12 カテゴリ集計 (Window Function PARTITION で share 算出)
  const from = new Date(Date.UTC(year, 0, 1));
  const to = new Date(Date.UTC(year + 1, 0, 1));

  interface RawCategory {
    category: string;
    revenue: bigint | number;
    units: bigint | number;
    order_count: bigint | number;
    share: number;
  }
  const rows = await prisma.$queryRaw<RawCategory[]>`
    SELECT
      p.category,
      COALESCE(SUM(oi.quantity * oi.unit_price), 0)::bigint AS revenue,
      COALESCE(SUM(oi.quantity), 0)::bigint                 AS units,
      COUNT(DISTINCT o.id)::bigint                          AS order_count,
      CASE WHEN SUM(SUM(oi.quantity * oi.unit_price)) OVER () = 0 THEN 0
           ELSE (SUM(oi.quantity * oi.unit_price)::float / SUM(SUM(oi.quantity * oi.unit_price)) OVER ())
      END AS share
    FROM order_items oi
    JOIN products p ON p.id = oi.product_id
    JOIN orders   o ON o.id = oi.order_id
    WHERE o.created_at >= ${from}
      AND o.created_at <  ${to}
    GROUP BY p.category
    ORDER BY revenue DESC;
  `;

  const categories = rows.map((r) => {
    const revenue = Number(r.revenue);
    const orderCount = Number(r.order_count);
    return {
      category: r.category,
      revenue,
      units: Number(r.units),
      orderCount,
      averageOrderValue: orderCount > 0 ? Math.round(revenue / orderCount) : 0,
      share: Number(r.share),
    };
  });

  // 月別客単価 (全カテゴリ合計の revenue / orders)
  interface RawMonthlyAov {
    month: Date;
    revenue: bigint | number;
    orders: bigint | number;
  }
  const monthlyRows = await prisma.$queryRaw<RawMonthlyAov[]>`
    SELECT
      DATE_TRUNC('month', created_at) AS month,
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint                AS orders
    FROM orders
    WHERE created_at >= ${from}
      AND created_at <  ${to}
    GROUP BY DATE_TRUNC('month', created_at)
    ORDER BY month;
  `;
  const aovByMonth = new Map<number, number>();
  for (const r of monthlyRows) {
    const rev = Number(r.revenue);
    const ord = Number(r.orders);
    aovByMonth.set(new Date(r.month).getUTCMonth(), ord > 0 ? Math.round(rev / ord) : 0);
  }
  const monthly = Array.from({ length: 12 }, (_, m) => ({
    month: `${year}-${String(m + 1).padStart(2, "0")}`,
    label: `${m + 1}月`,
    aov: aovByMonth.get(m) ?? 0,
  }));

  // overallAov は orders テーブルの実件数で割る (1 注文が複数カテゴリにまたがるため
  // categories[].orderCount の単純合計だと注文を重複カウントしてしまう)。
  const overallAggRows = await prisma.$queryRaw<Array<{ revenue: bigint | number; orders: bigint | number }>>`
    SELECT
      COALESCE(SUM(total), 0)::bigint AS revenue,
      COUNT(*)::bigint                AS orders
    FROM orders
    WHERE created_at >= ${from}
      AND created_at <  ${to};
  `;
  const totalRevenue = Number(overallAggRows[0]?.revenue ?? 0);
  const totalOrders = Number(overallAggRows[0]?.orders ?? 0);
  const overallAov = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

  return res.json({ year, overallAov, monthly, categories });
});
