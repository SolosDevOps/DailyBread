import { Router } from "express";
import {
  getBookmarks,
  addBookmark,
  deleteBookmark,
  getHighlights,
  addHighlight,
  deleteHighlight,
  getReadingHistory,
  addReadingHistory,
  getReadingPlan,
  startReadingPlan,
  getChapter,
} from "../controllers/bibleController";

const router = Router();

// Public Bible content
router.get("/chapter", getChapter);

// Bookmarks
router.get("/bookmarks", getBookmarks);
router.post("/bookmarks", addBookmark);
router.delete("/bookmarks/:id", deleteBookmark);

// Highlights
router.get("/highlights", getHighlights);
router.post("/highlights", addHighlight);
router.delete("/highlights/:id", deleteHighlight);

// Reading History
router.get("/reading-history", getReadingHistory);
router.post("/reading-history", addReadingHistory);

// Reading Plans
router.get("/reading-plan", getReadingPlan);
router.post("/reading-plan", startReadingPlan);

export default router;
