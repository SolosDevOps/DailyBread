import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { toggleLike, getPostLikes } from "../controllers/likeController";

const router = Router();

// Toggle like on a post
router.post("/toggle", requireAuth, toggleLike);

// Get likes for a post
router.get("/:postId", getPostLikes);

export default router;
