import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

router.get("/users", async (req, res) => {
  const q = ((req.query.q as string) || "").trim();
  if (!q) return res.status(400).json({ error: "Missing query parameter" });
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [{ username: { contains: q } }, { email: { contains: q } }],
      },
      select: {
        id: true,
        username: true,
        bio: true,
        profilePicture: true,
        createdAt: true,
      },
      take: 20,
    });
    return res.json(users);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
});

export default router;
