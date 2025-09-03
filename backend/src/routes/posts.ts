import { Router } from "express";
import { toggleLike } from "../controllers/likeController";
import {
  createPost,
  getPosts,
  getPostById,
  updatePost,
  deletePost,
} from "../controllers/postController";
import {
  getPostComments,
  createComment,
} from "../controllers/commentController";
import { requireAuth } from "../middleware/auth";

const router = Router();

// Post CRUD operations
router.post("/", requireAuth, createPost);
router.get("/", requireAuth, getPosts);
router.get("/:id", getPostById);
router.put("/:id", requireAuth, updatePost);
router.delete("/:id", requireAuth, deletePost);

// Comments operations
router.get("/:id/comments", getPostComments);
router.post("/:id/comments", requireAuth, (req, res) => {
  const postId = Number(req.params.id);
  if (isNaN(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  req.body.postId = postId;
  createComment(req, res);
});

// Like operations
router.post("/:id/like", requireAuth, (req, res) => {
  const postId = Number(req.params.id);
  if (isNaN(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  req.body = { postId };
  toggleLike(req, res);
});

router.delete("/:id/like", requireAuth, (req, res) => {
  const postId = Number(req.params.id);
  if (isNaN(postId)) {
    return res.status(400).json({ error: "Invalid post ID" });
  }
  req.body = { postId };
  toggleLike(req, res);
});

export default router;
