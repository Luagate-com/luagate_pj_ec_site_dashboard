# LuaGate 実践開発プロジェクト④ EC サイト売上分析ダッシュボード (starter)

> **このブランチは受講生が手を動かすための starter テンプレートです。**
> 完成版コードは `main` ブランチを参照してください。

LuaGate の実践開発プロジェクト 4 部作の最終章。**PJ#1 で作った EC サイト** の売上データを分析する管理者向けダッシュボードを構築する。

集計 SQL (GROUP BY / SUM / 月別 / カテゴリ別)、可視化 (Recharts)、認証付きダッシュボードを一気通貫で学ぶ。

## starter の進め方

このブランチでは下記が **TODO (501 を返す or プレースホルダー UI)** になっています。
LuaGate のカリキュラム Ch7-3 〜 Ch7-8 を順番に進めながら埋めていってください。

### API 側 (`api/src/routes/dashboard.ts`)

| TODO | 章 | やること |
| --- | --- | --- |
| `GET /api/dashboard/summary` | Ch7-3 | 総売上 / 総注文数 / 客単価 + 前年差分 + sparkline |
| `GET /api/dashboard/monthly` | Ch7-4 | DATE_TRUNC('month', ...) で月次集計 |
| `GET /api/dashboard/weekly` | Ch7-5 | DATE_TRUNC('week', ...) で週次集計 |
| `GET /api/dashboard/products/sales-ranking` | Ch7-5 | JOIN + GROUP BY + ORDER BY revenue |
| `GET /api/dashboard/products/order-ranking` | Ch7-5 | JOIN + GROUP BY + ORDER BY units |
| `GET /api/dashboard/categories` | Ch7-5 | カテゴリ別シェアと客単価 |

### Frontend 側 (`frontend/src/components/`)

| TODO | 章 | やること |
| --- | --- | --- |
| `KpiCard.tsx` | Ch7-6 | 増減バッジ + 大数値 + ミニグラフを組み立てる |
| `Sparkline.tsx` | Ch7-6 | Recharts の LineChart / BarChart で小さなグラフ |
| `LineChart.tsx` | Ch7-7 | Recharts の LineChart で売上推移を描画 |
| `RankingList.tsx` | Ch7-8 | 横棒の BarChart (layout=vertical) でランキング |
| `DonutChart.tsx` | Ch7-8 | 円グラフ (innerRadius でドーナツ) + 中央表示 |

各 TODO ファイルにヒントコメントが書いてあるので、Figma + 完成版 URL を見ながら自力で書いてみてください。

## DB について

- Neon の `luagate_dashboard` データベースを **完成版と共有** しています (受講生が自前で seed を流し直す必要なし)
- ローカルで動かす場合のみ Docker + `prisma migrate` + `npm run db:seed` が必要

## 世界観

- PJ#1 — EC サイト本体 (顧客向け)
- PJ#2 — タスク管理アプリ (社内向け)
- PJ#3 — AI チャットアプリ (カスタマーサポート)
- **PJ#4 — 売上分析ダッシュボード (経営者・マーケター向け)** ← 本リポジトリ

## ディレクトリ構成

```
luagate_pj_ec_site_dashboard/
├─ README.md
├─ api/                # Backend (Express + Prisma + PostgreSQL)
├─ frontend/           # Frontend (Vite + React + Recharts + Tailwind)
└─ docs/
```

## 機能

### 画面

- ログイン / 新規登録
- 総合ダッシュボード (KPI カード 3 つ + 各カードに増減 / Sparkline)
- 売上推移 (月別 / 週別タブ切替、TOP 10 ランキング)
- 商品ランキング (売上順 / 注文数順 切替)
- カテゴリ分析 (ドーナツチャート + 客単価推移)

### バックエンド API

| エンドポイント | 説明 |
| --- | --- |
| `POST /api/auth/signup` | 新規登録 |
| `POST /api/auth/login` | ログイン (JWT 発行) |
| `GET /api/me` | 自分の情報 |
| `GET /api/dashboard/summary` | 総売上 / 総注文数 / 客単価 + 増減 + sparkline |
| `GET /api/dashboard/monthly?year=2025` | 月別売上推移 |
| `GET /api/dashboard/weekly?month=2025-12` | 週別売上推移 |
| `GET /api/dashboard/products/sales-ranking?year=2025` | 商品売上 TOP 10 |
| `GET /api/dashboard/products/order-ranking?year=2025` | 商品注文数 TOP 10 |
| `GET /api/dashboard/categories?year=2025` | カテゴリ別売上 + 客単価 + シェア |

## 起動方法

### 1. PostgreSQL 起動 (Docker)

```bash
docker run -d --name luagate-dashboard-db \
  -e POSTGRES_USER=dashboard \
  -e POSTGRES_PASSWORD=dashboard_dev \
  -e POSTGRES_DB=luagate_dashboard \
  -p 5434:5432 \
  postgres:16-alpine
```

### 2. Backend (API)

```bash
cd api
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed   # 約 360 件のサンプル注文を投入
npm run dev
# => http://localhost:3032
```

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
# => http://localhost:5176
```

## デモアカウント

| Email | Password |
| --- | --- |
| `alice@example.com` | `password123` |
| `bob@example.com` | `password123` |
| `carol@example.com` | `password123` |

## 学習ポイント

### 1. 集計 SQL (DATE_TRUNC / EXTRACT / GROUP BY / SUM)

`api/src/routes/dashboard.ts` に `prisma.$queryRaw` で書かれた集計クエリが並んでいる。
受講生は Prisma の集計 API ではなく **生の SQL** を読んでパターンを学ぶ。

```sql
-- 月別売上
SELECT
  DATE_TRUNC('month', created_at) AS month,
  SUM(total) AS revenue,
  COUNT(*) AS orders
FROM orders
WHERE EXTRACT(YEAR FROM created_at) = $1
GROUP BY 1
ORDER BY 1;
```

### 2. JOIN + GROUP BY (商品ランキング)

```sql
SELECT
  p.id, p.name,
  SUM(oi.quantity * oi.unit_price) AS revenue,
  SUM(oi.quantity) AS units
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE EXTRACT(YEAR FROM o.created_at) = $1
GROUP BY p.id, p.name
ORDER BY revenue DESC
LIMIT 10;
```

### 3. Recharts による可視化

- `LineChart` — 売上推移
- `BarChart (vertical layout)` — 横棒ランキング
- `PieChart (innerRadius)` — ドーナツチャート

## デザイントークン (Figma 準拠)

| 用途 | 値 |
| --- | --- |
| Brand | `#05B45B` (緑) |
| Brand Light | `rgba(5,180,91,0.1)` |
| Ink | `#363635` |
| Ink Sub | `#727270` |
| Surface | `#FDFDFA` |
| Surface 2 | `#F5F4ED` |
| Danger | `#F15025` |
| Warning | `#F2B705` |

## ポート割り当て (他 PJ と被らない)

| サービス | ポート |
| --- | --- |
| API | 3032 |
| Frontend | 5176 |
| PostgreSQL | 5434 |

## Figma

https://www.figma.com/design/5LLAPdI03tsb3z0ufTofP6/?node-id=834-1390

## デモ URL (本番)

### 完成版 (main ブランチ)

- **Frontend** https://prod-luagate-pj-dashboard-frontend-v3bbmayaea-an.a.run.app
- **API** https://prod-luagate-pj-dashboard-api-v3bbmayaea-an.a.run.app

### starter (このブランチ)

- **Frontend** https://prod-luagate-pj-dashboard-starter-frontend-v3bbmayaea-an.a.run.app
- **API** https://prod-luagate-pj-dashboard-starter-api-v3bbmayaea-an.a.run.app
- API は 501 を返す TODO 集計が含まれているので、Frontend は読み込み中のままになる箇所があります (これが starter の正しい状態です)

### デモアカウント

alice@example.com / bob@example.com / carol@example.com (password: `password123`)
