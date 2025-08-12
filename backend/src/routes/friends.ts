import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import {
  sendRequest,
  acceptRequest,
  rejectRequest,
  getFriends,
  getRequests,
} from "../controllers/friendController";

const router = Router();

router.post("/request", requireAuth, sendRequest);
router.post("/:id/accept", requireAuth, acceptRequest);
router.post("/:id/reject", requireAuth, rejectRequest);
router.get("/", requireAuth, getFriends);
router.get("/requests", requireAuth, getRequests);

export default router;
