import { Router } from "express";
import { prisma } from "../index";
import { requireAuth } from "../middleware/auth";

export const meRouter = Router();

// 自分の情報を返す
meRouter.get("/", requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.userId! },
    select: { id: true, email: true, displayName: true, createdAt: true },
  });
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});
