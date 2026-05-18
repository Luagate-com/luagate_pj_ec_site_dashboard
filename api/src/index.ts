import "dotenv/config";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import { PrismaClient } from "@prisma/client";

import { authRouter } from "./routes/auth";
import { meRouter } from "./routes/me";
import { dashboardRouter } from "./routes/dashboard";

export const prisma = new PrismaClient();

const app = express();
const PORT = Number(process.env.PORT) || 3032;

app.use(helmet());
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") ?? "*",
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));

// ヘルスチェック
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", service: "luagate_pj_ec_site_dashboard", version: "1.0.0" });
});
app.get("/health", (_req, res) => {
  res.json({ status: "ok", service: "luagate_pj_ec_site_dashboard", version: "1.0.0" });
});

// API ルート
app.use("/api/auth", authRouter);
app.use("/api/me", meRouter);
app.use("/api/dashboard", dashboardRouter);

// 404 ハンドラ
app.use((_req, res) => {
  res.status(404).json({ error: "Not Found" });
});

// エラーハンドラ
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[error]", err);
  res.status(500).json({ error: err.message || "Internal Server Error" });
});

app.listen(PORT, () => {
  console.log(`[luagate_pj_ec_site_dashboard] listening on :${PORT}`);
});
