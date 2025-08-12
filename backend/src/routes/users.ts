import { Router } from "express";
import {
  getUserById,
  getUserPosts,
  getUserStats,
} from "../controllers/userController";

const router = Router();

router.get("/:id", getUserById);
router.get("/:id/posts", getUserPosts);
router.get("/:id/stats", getUserStats);

export default router;
