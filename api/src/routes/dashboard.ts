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

// 動作確認用に prisma を 1 度だけ参照 (未使用警告を抑える)。
// 集計 SQL を書き始めたら不要なので消して構いません。
void prisma;

// ===== /api/dashboard/summary =====
// Ch7-3: KPI 集計 API
// 総売上 / 総注文数 / 客単価 + 前年比増減 + 直近 6 ヶ月の sparkline を返す。
//
// ヒント
// - SELECT SUM(total), COUNT(*) FROM orders WHERE EXTRACT(YEAR FROM created_at) = $1
// - 前年 (year - 1) でも同じ集計を行う
// - sparkline は DATE_TRUNC('month', created_at) で GROUP BY して直近 6 ヶ月分を抜き出す
// - 客単価 (AOV) = 売上 / 注文数。0 除算に注意
dashboardRouter.get("/summary", async (_req, res) => {
  // TODO Ch7-3 集計クエリ
  // 1) 当年 (2025) の総売上 / 総注文数を $queryRaw で取得
  // 2) 前年 (2024) も同様に取得
  // 3) sparkline 用に直近 6 ヶ月の月別売上 / 注文数を集計
  // 4) AOV (客単価) を計算
  // 計算が終わったら下の res.json のダミー値を置き換えてください。
  res.status(501).json({
    error: "Not implemented yet — see chapter 7-3 (/api/dashboard/summary)",
    hint: "prisma.$queryRaw で SUM(total), COUNT(*) を集計してください",
    updatedAt: new Date().toISOString(),
    revenue: { current: 0, previous: 0, delta: 0, sparkline: [] as number[] },
    orders: { current: 0, previous: 0, delta: 0, sparkline: [] as number[] },
    aov: { current: 0, previous: 0, delta: 0, sparkline: [] as number[] },
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

  // TODO Ch7-4 月別集計
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
    error: "Not implemented yet — see chapter 7-4 (/api/dashboard/monthly)",
    year,
    monthly,
  });
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

  // TODO Ch7-5 週別集計
  // ヒント
  // - 対象月の開始 / 終了日を計算 (例 new Date(year, monthNum - 1, 1) と new Date(year, monthNum, 1))
  // - DATE_TRUNC('week', created_at) で週単位グループ化
  // - WHERE created_at >= $start AND created_at < $end
  // - 戻り値の week は "YYYY-MM-DD"、label は "第N週"
  return res.status(501).json({
    error: "Not implemented yet — see chapter 7-5 (/api/dashboard/weekly)",
    month,
    weekly: [] as Array<{ week: string; label: string; revenue: number; orders: number }>,
  });
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

  // TODO Ch7-5 商品売上ランキング
  // ヒント
  // - order_items と products / orders を JOIN
  // - SUM(oi.quantity * oi.unit_price) を revenue として集計
  // - GROUP BY p.id, p.name, p.category
  // - ORDER BY revenue DESC LIMIT $limit
  return res.status(501).json({
    error: "Not implemented yet — see chapter 7-5 (/api/dashboard/products/sales-ranking)",
    year,
    limit,
    ranking: [] as Array<{ id: string; name: string; category: string; revenue: number; units: number }>,
  });
});

// ===== /api/dashboard/products/order-ranking =====
// Ch7-5: 商品注文数ランキング (SUM(quantity))
dashboardRouter.get("/products/order-ranking", async (req, res) => {
  const parsed = productRankingQuerySchema.safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
  const { year, limit } = parsed.data;

  // TODO Ch7-5 商品注文数ランキング
  // ヒント
  // - 売上ランキングと似た JOIN だが ORDER BY units DESC
  // - 折れ線用の monthly[] (月別注文数) も別途集計する
  const monthly = Array.from({ length: 12 }, (_, m) => ({
    month: `${year}-${String(m + 1).padStart(2, "0")}`,
    label: `${m + 1}月`,
    orders: 0,
  }));

  return res.status(501).json({
    error: "Not implemented yet — see chapter 7-5 (/api/dashboard/products/order-ranking)",
    year,
    limit,
    monthly,
    ranking: [] as Array<{ id: string; name: string; category: string; units: number; revenue: number }>,
  });
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

  // TODO Ch7-5 カテゴリ集計
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
    error: "Not implemented yet — see chapter 7-5 (/api/dashboard/categories)",
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
