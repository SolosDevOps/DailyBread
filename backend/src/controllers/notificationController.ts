import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Get notifications for the authenticated user
export const getNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      include: {
        triggerUser: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
        post: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 50, // Limit to 50 most recent notifications
    });

    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({ error: "Failed to fetch notifications" });
  }
};

// Get unread notification count
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const count = await prisma.notification.count({
      where: {
        userId,
        seen: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error("Error fetching unread count:", error);
    res.status(500).json({ error: "Failed to fetch unread count" });
  }
};

// Mark notification as seen
export const markAsSeen = async (req: Request, res: Response) => {
  try {
    const { notificationId } = req.params;
    const userId = (req as any).user.id;

    await prisma.notification.updateMany({
      where: {
        id: parseInt(notificationId),
        userId, // Ensure user can only mark their own notifications
      },
      data: {
        seen: true,
        seenAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking notification as seen:", error);
    res.status(500).json({ error: "Failed to mark notification as seen" });
  }
};

// Mark all notifications as seen
export const markAllAsSeen = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        seen: false,
      },
      data: {
        seen: true,
        seenAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error marking all notifications as seen:", error);
    res.status(500).json({ error: "Failed to mark all notifications as seen" });
  }
};

// Create notification (used internally)
export const createNotification = async (
  userId: number,
  triggeredBy: number,
  type: "like" | "comment" | "follow",
  message: string,
  postId?: number
) => {
  try {
    // Don't create notification if user is triggering action on their own content
    if (userId === triggeredBy) return;

    // Check if similar notification already exists (to prevent spam)
    const existing = await prisma.notification.findFirst({
      where: {
        userId,
        triggeredBy,
        type,
        postId: postId || null,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    });

    if (existing) return; // Don't create duplicate notifications

    await prisma.notification.create({
      data: {
        userId,
        triggeredBy,
        type,
        message,
        postId: postId || null,
      },
    });
  } catch (error) {
    console.error("Error creating notification:", error);
  }
};

// Clean up seen notifications older than 24 hours
export const cleanupSeenNotifications = async () => {
  try {
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    await prisma.notification.deleteMany({
      where: {
        seen: true,
        seenAt: {
          lt: twentyFourHoursAgo,
        },
      },
    });

    console.log("Cleaned up old seen notifications");
  } catch (error) {
    console.error("Error cleaning up notifications:", error);
  }
};
