import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// カテゴリ別の商品マスタ (Figma 仕様の 5 カテゴリ)
const PRODUCT_CATALOG: Array<{ name: string; category: string; price: number }> = [
  // エレクトロニクス (35% シェア想定なので高単価・点数多め)
  { name: "ワイヤレスノイズキャンセリングヘッドホン", category: "エレクトロニクス", price: 38000 },
  { name: "4K 有機 EL モニター 27インチ", category: "エレクトロニクス", price: 89000 },
  { name: "スマートウォッチ Pro", category: "エレクトロニクス", price: 52000 },
  { name: "メカニカルキーボード 茶軸", category: "エレクトロニクス", price: 18500 },
  { name: "ゲーミングマウス 16000DPI", category: "エレクトロニクス", price: 12800 },
  { name: "USB-C ハブ 8 in 1", category: "エレクトロニクス", price: 6800 },
  { name: "Bluetooth スピーカー 防水", category: "エレクトロニクス", price: 9800 },
  { name: "ポータブル SSD 1TB", category: "エレクトロニクス", price: 14800 },

  // ファッション (25%)
  { name: "オーバーサイズ コットンシャツ", category: "ファッション", price: 7800 },
  { name: "メリノウール ニットセーター", category: "ファッション", price: 12800 },
  { name: "ストレッチデニム スリムフィット", category: "ファッション", price: 9800 },
  { name: "レザースニーカー ホワイト", category: "ファッション", price: 18500 },
  { name: "ダウンジャケット 軽量モデル", category: "ファッション", price: 24800 },
  { name: "シルクスカーフ プリント", category: "ファッション", price: 8800 },
  { name: "本革ビジネスバッグ", category: "ファッション", price: 32000 },

  // ホーム&キッチン (20%)
  { name: "鋳鉄製ダッチオーブン 24cm", category: "ホーム&キッチン", price: 14800 },
  { name: "コードレス スティック掃除機", category: "ホーム&キッチン", price: 38000 },
  { name: "全自動コーヒーメーカー", category: "ホーム&キッチン", price: 28800 },
  { name: "羽毛布団 シングル", category: "ホーム&キッチン", price: 19800 },
  { name: "スマート LED 照明セット", category: "ホーム&キッチン", price: 8800 },
  { name: "包丁 三徳 ステンレス", category: "ホーム&キッチン", price: 9800 },

  // スポーツ&アウトドア (12%)
  { name: "ランニングシューズ プロモデル", category: "スポーツ&アウトドア", price: 16800 },
  { name: "ヨガマット 6mm 厚手", category: "スポーツ&アウトドア", price: 4800 },
  { name: "テント 2 人用 軽量", category: "スポーツ&アウトドア", price: 28800 },
  { name: "ダンベルセット 20kg 可変式", category: "スポーツ&アウトドア", price: 18800 },
  { name: "ロードバイク用ヘルメット", category: "スポーツ&アウトドア", price: 12800 },

  // 書籍&メディア (8%)
  { name: "プログラミング入門書 第3版", category: "書籍&メディア", price: 3200 },
  { name: "経営戦略の基本", category: "書籍&メディア", price: 2400 },
  { name: "デザイン思考ハンドブック", category: "書籍&メディア", price: 2800 },
  { name: "ベストセラー小説 ハードカバー", category: "書籍&メディア", price: 1980 },
  { name: "サイエンス雑誌 年間定期購読", category: "書籍&メディア", price: 9800 },
];

// 各カテゴリの注文シェア (Figma ドーナツチャートに合わせる)
const CATEGORY_SHARE: Record<string, number> = {
  "エレクトロニクス": 0.35,
  "ファッション": 0.25,
  "ホーム&キッチン": 0.20,
  "スポーツ&アウトドア": 0.12,
  "書籍&メディア": 0.08,
};

// 月ごとの売上係数 (12月にピーク、夏に少し落ち込む等の現実的な変動)
const MONTH_FACTOR = [0.85, 0.78, 0.92, 0.95, 0.98, 0.88, 0.82, 0.80, 0.95, 1.05, 1.12, 1.30];

function pickByShare<T>(items: T[], shareOf: (item: T) => number, rand: number): T {
  let acc = 0;
  for (const it of items) {
    acc += shareOf(it);
    if (rand <= acc) return it;
  }
  return items[items.length - 1];
}

function randomBetween(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function main() {
  // 既存データ削除 (開発用)
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.user.deleteMany();

  // デモユーザー (分析担当者 3 名)
  const password = await bcrypt.hash("password123", 10);
  const analystUsers = await Promise.all([
    prisma.user.create({
      data: { email: "alice@example.com", passwordHash: password, displayName: "Alice 山田" },
    }),
    prisma.user.create({
      data: { email: "bob@example.com", passwordHash: password, displayName: "Bob 鈴木" },
    }),
    prisma.user.create({
      data: { email: "carol@example.com", passwordHash: password, displayName: "Carol 田中" },
    }),
  ]);

  // 商品マスタを投入
  const products = [];
  for (const p of PRODUCT_CATALOG) {
    products.push(await prisma.product.create({ data: p }));
  }

  // カテゴリごとの商品リストをグループ化
  const productsByCategory: Record<string, typeof products> = {};
  for (const p of products) {
    if (!productsByCategory[p.category]) productsByCategory[p.category] = [];
    productsByCategory[p.category].push(p);
  }

  // 1 年分の注文を生成 (2025 年: 12 ヶ月、計約 360 件)
  // Figma の総売上 ¥12,450,000 / 総注文数 1,234 をおおむね再現できる規模感
  const year = 2025;
  let orderCount = 0;
  const baseOrdersPerMonth = 30; // 平均 30 件/月 × 12 = 360 件程度

  const allOrders: Array<{
    userId: string;
    total: number;
    createdAt: Date;
    items: Array<{ productId: string; quantity: number; unitPrice: number }>;
  }> = [];

  for (let month = 0; month < 12; month++) {
    const factor = MONTH_FACTOR[month];
    const monthlyOrders = Math.round(baseOrdersPerMonth * factor);

    for (let i = 0; i < monthlyOrders; i++) {
      // 注文日 (月内ランダム)
      const day = randomBetween(1, 28);
      const hour = randomBetween(9, 22);
      const createdAt = new Date(year, month, day, hour, randomBetween(0, 59));

      // 注文者
      const userId = analystUsers[randomBetween(0, analystUsers.length - 1)].id;

      // 1 注文あたりのアイテム数 (1-4)
      const itemCount = randomBetween(1, 4);
      const items: Array<{ productId: string; quantity: number; unitPrice: number }> = [];
      let total = 0;

      // カテゴリ別のシェアに従って商品を選ぶ
      const usedProductIds = new Set<string>();
      for (let j = 0; j < itemCount; j++) {
        const r = Math.random();
        let acc = 0;
        let chosenCategory = "エレクトロニクス";
        for (const [cat, share] of Object.entries(CATEGORY_SHARE)) {
          acc += share;
          if (r <= acc) {
            chosenCategory = cat;
            break;
          }
        }
        const catProducts = productsByCategory[chosenCategory];
        const candidate = catProducts[randomBetween(0, catProducts.length - 1)];
        if (usedProductIds.has(candidate.id)) continue;
        usedProductIds.add(candidate.id);

        const quantity = randomBetween(1, 2);
        const unitPrice = candidate.price;
        items.push({ productId: candidate.id, quantity, unitPrice });
        total += quantity * unitPrice;
      }

      if (items.length === 0) continue;

      allOrders.push({ userId, total, createdAt, items });
      orderCount++;
    }
  }

  // 一括投入 (Prisma の create は items も nested 作成できる)
  for (const o of allOrders) {
    await prisma.order.create({
      data: {
        userId: o.userId,
        total: o.total,
        createdAt: o.createdAt,
        items: { create: o.items },
      },
    });
  }

  // 集計サマリ
  const totalRevenueAgg = await prisma.order.aggregate({ _sum: { total: true } });
  const totalOrders = await prisma.order.count();
  const totalProducts = await prisma.product.count();

  // pickByShare はデモのため未使用 (将来の seed 拡張ポイント)
  void pickByShare;

  console.log("Seed completed");
  console.log(`  ${analystUsers.length} users — alice@example.com / bob@example.com / carol@example.com (password: password123)`);
  console.log(`  ${totalProducts} products across 5 categories`);
  console.log(`  ${totalOrders} orders (約 ${orderCount} 件)`);
  console.log(`  total revenue: ¥${(totalRevenueAgg._sum.total ?? 0).toLocaleString()}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
