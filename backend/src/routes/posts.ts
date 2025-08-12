import { Router } from "express";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/postController";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/", requireAuth, createPost); // Create
router.get("/", getPosts); // List
router.get("/:id", getPostById); // Read single
router.put("/:id", requireAuth, updatePost); // Update
router.delete("/:id", requireAuth, deletePost); // Delete

export default router;
