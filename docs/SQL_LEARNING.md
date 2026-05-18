# 集計 SQL 学習ガイド

このプロジェクトの API は **集計 SQL を学ぶための教材** として設計されている。
Prisma の便利な集計 API ではなく、あえて `$queryRaw` で生 SQL を書いているのはそのため。

## テーブル定義

```
users (id, email, password_hash, display_name, created_at, updated_at)
products (id, name, category, price, created_at, updated_at)
orders (id, user_id, total, created_at, updated_at)
order_items (id, order_id, product_id, quantity, unit_price)
```

## 重要な集計関数

| 関数 | 用途 |
| --- | --- |
| `SUM(col)` | 合計 |
| `COUNT(*)` | 件数 |
| `AVG(col)` | 平均 |
| `DATE_TRUNC('month', col)` | 月単位に丸める |
| `DATE_TRUNC('week', col)` | 週単位に丸める |
| `EXTRACT(YEAR FROM col)` | 年だけ取り出す |
| `GROUP BY` | グルーピング |
| `ORDER BY ... DESC LIMIT N` | TOP N |

## 練習 1. 月別売上

```sql
SELECT
  DATE_TRUNC('month', created_at) AS month,
  SUM(total) AS revenue,
  COUNT(*) AS orders
FROM orders
WHERE EXTRACT(YEAR FROM created_at) = 2025
GROUP BY 1
ORDER BY 1;
```

ポイント: `DATE_TRUNC` で月初の `timestamp` に揃えると、月単位で同じグループになる。

## 練習 2. 商品売上 TOP 10

```sql
SELECT
  p.id, p.name, p.category,
  SUM(oi.quantity * oi.unit_price) AS revenue,
  SUM(oi.quantity) AS units
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE EXTRACT(YEAR FROM o.created_at) = 2025
GROUP BY p.id, p.name, p.category
ORDER BY revenue DESC
LIMIT 10;
```

ポイント: `quantity * unit_price` を SUM することで「商品ごとの累計売上」が得られる。

## 練習 3. カテゴリ別シェア

```sql
SELECT
  p.category,
  SUM(oi.quantity * oi.unit_price) AS revenue,
  COUNT(DISTINCT o.id) AS order_count
FROM order_items oi
JOIN products p ON oi.product_id = p.id
JOIN orders o ON oi.order_id = o.id
WHERE EXTRACT(YEAR FROM o.created_at) = 2025
GROUP BY p.category
ORDER BY revenue DESC;
```

シェア (%) は、API 側で `revenue / SUM(revenue)` を計算してから返している。
SQL で計算するなら `SUM(...) OVER ()` というウィンドウ関数を使う。

## 練習 4. 客単価 (AOV)

```sql
SELECT
  COALESCE(SUM(total), 0) / NULLIF(COUNT(*), 0) AS aov
FROM orders
WHERE EXTRACT(YEAR FROM created_at) = 2025;
```

`NULLIF(x, 0)` で 0 除算を回避するのが定番テクニック。
