import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change_me";

// Public Bible content (no auth required)
// GET /api/bible/chapter?book=Genesis&chapter=1&version=web
export async function getChapter(req: Request, res: Response) {
  try {
    const book = String(req.query.book || "").trim();
    const chapter = parseInt(String(req.query.chapter || "1"), 10);
    const versionRaw = String(req.query.version || "web").toLowerCase();

    if (!book || !Number.isFinite(chapter) || chapter <= 0) {
      return res.status(400).json({ error: "Missing or invalid book/chapter" });
    }

    // bible-api.com supports: web (World English Bible), kjv, asv, ylt, darby
    const supportedPublic = new Set(["web", "kjv", "asv", "ylt", "darby"]);
    const version = supportedPublic.has(versionRaw) ? versionRaw : "web";

    const ref = encodeURIComponent(`${book} ${chapter}`);
    const url = `https://bible-api.com/${ref}?translation=${version}`;

    const resp = await fetch(url);
    if (!resp.ok) {
      const text = await resp.text().catch(() => "");
      return res.status(502).json({ error: "Bible API failed", details: text });
    }

    const data = (await resp.json()) as {
      reference: string;
      verses: Array<{
        book_name: string;
        chapter: number;
        verse: number;
        text: string;
      }>;
      translation_name?: string;
      translation_id?: string;
    };

    const verses = (data.verses || []).map((v) => ({
      book: v.book_name,
      chapter: v.chapter,
      verse: v.verse,
      text: (v.text || "").trim(),
      version: (data.translation_id || version).toUpperCase(),
    }));

    return res.json({
      book,
      chapter,
      version: (data.translation_id || version).toUpperCase(),
      translation: data.translation_name || version.toUpperCase(),
      verses,
    });
  } catch (err: any) {
    console.error("Get chapter error:", err);
    return res.status(500).json({ error: "Failed to fetch chapter" });
  }
}

// Get user's bookmarks
export async function getBookmarks(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };

    const bookmarks = await prisma.bibleBookmark.findMany({
      where: { userId: payload.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json(bookmarks);
  } catch (err: any) {
    console.error("Get bookmarks error:", err);
    return res.status(500).json({ error: "Failed to fetch bookmarks" });
  }
}

// Add bookmark
export async function addBookmark(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { book, chapter, verse, text, note } = req.body;

    if (!book || !chapter || !verse || !text) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const bookmark = await prisma.bibleBookmark.create({
      data: {
        userId: payload.id,
        book,
        chapter,
        verse,
        text,
        note: note || null,
      },
    });

    return res.status(201).json(bookmark);
  } catch (err: any) {
    console.error("Add bookmark error:", err);
    return res.status(500).json({ error: "Failed to add bookmark" });
  }
}

// Delete bookmark
export async function deleteBookmark(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { id } = req.params;

    const bookmark = await prisma.bibleBookmark.findUnique({
      where: { id: parseInt(id) },
    });

    if (!bookmark) {
      return res.status(404).json({ error: "Bookmark not found" });
    }

    if (bookmark.userId !== payload.id) {
      return res.status(403).json({ error: "Not authorized" });
    }

    await prisma.bibleBookmark.delete({
      where: { id: parseInt(id) },
    });

    return res.json({ message: "Bookmark deleted" });
  } catch (err: any) {
    console.error("Delete bookmark error:", err);
    return res.status(500).json({ error: "Failed to delete bookmark" });
  }
}

// Get user's highlights
export async function getHighlights(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };

    const highlights = await prisma.bibleHighlight.findMany({
      where: { userId: payload.id },
      orderBy: { createdAt: "desc" },
    });

    return res.json(highlights);
  } catch (err: any) {
    console.error("Get highlights error:", err);
    return res.status(500).json({ error: "Failed to fetch highlights" });
  }
}

// Add highlight
export async function addHighlight(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { book, chapter, verse, text, color } = req.body;

    if (!book || !chapter || !verse || !text || !color) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const highlight = await prisma.bibleHighlight.create({
      data: {
        userId: payload.id,
        book,
        chapter,
        verse,
        text,
        color,
      },
    });

    return res.status(201).json(highlight);
  } catch (err: any) {
    console.error("Add highlight error:", err);
    return res.status(500).json({ error: "Failed to add highlight" });
  }
}

// Delete highlight
export async function deleteHighlight(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { id } = req.params;

    const highlight = await prisma.bibleHighlight.findUnique({
      where: { id: parseInt(id) },
    });

    if (!highlight)
      return res.status(404).json({ error: "Highlight not found" });
    if (highlight.userId !== payload.id)
      return res.status(403).json({ error: "Not authorized" });

    await prisma.bibleHighlight.delete({ where: { id: parseInt(id) } });
    return res.json({ message: "Highlight deleted" });
  } catch (err: any) {
    console.error("Delete highlight error:", err);
    return res.status(500).json({ error: "Failed to delete highlight" });
  }
}

// Get reading history
export async function getReadingHistory(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };

    const history = await prisma.bibleReadingHistory.findMany({
      where: { userId: payload.id },
      orderBy: { dateRead: "desc" },
      take: 100, // Limit to last 100 entries
    });

    return res.json(history);
  } catch (err: any) {
    console.error("Get reading history error:", err);
    return res.status(500).json({ error: "Failed to fetch reading history" });
  }
}

// Add reading history entry
export async function addReadingHistory(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { book, chapter, dateRead } = req.body;

    if (!book || !chapter) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check if already marked as read today
    const today = new Date(dateRead || Date.now());
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate() + 1
    );

    const existingEntry = await prisma.bibleReadingHistory.findFirst({
      where: {
        userId: payload.id,
        book,
        chapter,
        dateRead: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
    });

    if (existingEntry) {
      return res.json(existingEntry); // Already exists, return existing
    }

    const historyEntry = await prisma.bibleReadingHistory.create({
      data: {
        userId: payload.id,
        book,
        chapter,
        dateRead: today,
      },
    });

    return res.status(201).json(historyEntry);
  } catch (err: any) {
    console.error("Add reading history error:", err);
    return res.status(500).json({ error: "Failed to add reading history" });
  }
}

// Get user's reading plan
export async function getReadingPlan(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };

    const userPlan = await prisma.bibleReadingPlan.findFirst({
      where: { userId: payload.id },
    });

    if (!userPlan) {
      return res.json({ plan: null, progress: {} });
    }

    // Get progress
    const progress = await prisma.bibleReadingProgress.findMany({
      where: { readingPlanId: userPlan.id },
    });

    const progressMap: { [key: string]: boolean } = {};
    progress.forEach((p: { day: number; completed: boolean }) => {
      progressMap[`day-${p.day}`] = p.completed;
    });

    return res.json({
      plan: {
        id: userPlan.planId,
        name: userPlan.planName,
        description: userPlan.planDescription,
        duration: userPlan.duration,
        startDate: userPlan.startDate,
      },
      progress: progressMap,
    });
  } catch (err: any) {
    console.error("Get reading plan error:", err);
    return res.status(500).json({ error: "Failed to fetch reading plan" });
  }
}

// Start reading plan
export async function startReadingPlan(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { planId } = req.body;

    if (!planId) {
      return res.status(400).json({ error: "Plan ID is required" });
    }

    // Delete existing plan if any
    const existingPlan = await prisma.bibleReadingPlan.findFirst({
      where: { userId: payload.id },
    });

    if (existingPlan) {
      await prisma.bibleReadingProgress.deleteMany({
        where: { readingPlanId: existingPlan.id },
      });
      await prisma.bibleReadingPlan.delete({
        where: { id: existingPlan.id },
      });
    }

    // Mock plan data - in a real app, this would come from a plans database
    const planData = {
      "chronological-1year": {
        name: "Chronological Bible in a Year",
        description:
          "Read through the Bible in chronological order over 365 days",
        duration: 365,
      },
      "mcheyne-1year": {
        name: "M'Cheyne Reading Plan",
        description:
          "Classic plan reading OT once and NT/Psalms twice in a year",
        duration: 365,
      },
      "bible-90days": {
        name: "Bible in 90 Days",
        description: "Read through the entire Bible in just 90 days",
        duration: 90,
      },
      "gospels-30days": {
        name: "Gospels in 30 Days",
        description: "Focus on the life of Jesus through the four Gospels",
        duration: 30,
      },
      "psalms-proverbs": {
        name: "Psalms & Proverbs",
        description: "Read one Psalm and one Proverb each day",
        duration: 150,
      },
    };

    const plan = planData[planId as keyof typeof planData];
    if (!plan) {
      return res.status(400).json({ error: "Invalid plan ID" });
    }

    const newPlan = await prisma.bibleReadingPlan.create({
      data: {
        userId: payload.id,
        planId,
        planName: plan.name,
        planDescription: plan.description,
        duration: plan.duration,
        startDate: new Date(),
      },
    });

    return res.status(201).json(newPlan);
  } catch (err: any) {
    console.error("Start reading plan error:", err);
    return res.status(500).json({ error: "Failed to start reading plan" });
  }
}
