import express from "express";
import { requireAuth } from "../middleware/auth";
import {
  getNotifications,
  getUnreadCount,
  markAsSeen,
  markAllAsSeen,
} from "../controllers/notificationController";

const router = express.Router();

// All notification routes require authentication
router.use(requireAuth);

// Get notifications for authenticated user
router.get("/", getNotifications);

// Get unread notification count
router.get("/unread-count", getUnreadCount);

// Mark specific notification as seen
router.patch("/:notificationId/seen", markAsSeen);

// Mark all notifications as seen
router.patch("/mark-all-seen", markAllAsSeen);

export default router;
