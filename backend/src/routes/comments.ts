import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  createComment,
  getPostComments,
  deleteComment,
} from "../controllers/commentController";

const router = Router();

// Create a comment
router.post("/", requireAuth, createComment);

// Get comments for a post
router.get("/:postId", getPostComments);

// Delete a comment
router.delete("/:commentId", requireAuth, deleteComment);

export default router;
