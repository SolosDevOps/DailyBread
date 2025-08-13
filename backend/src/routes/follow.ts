import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  followUser,
  unfollowUser,
  getFollowStatus,
  getFollowers,
  getFollowing,
} from "../controllers/followController";

const router = Router();

router.post("/:userId", requireAuth, followUser);
router.delete("/:userId", requireAuth, unfollowUser);
router.get("/:userId/status", requireAuth, getFollowStatus);
router.get("/:userId/followers", getFollowers);
router.get("/:userId/following", getFollowing);

export default router;
