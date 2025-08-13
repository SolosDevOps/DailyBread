import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { createNotification } from "./notificationController";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Toggle like on a post
export async function toggleLike(req: Request, res: Response) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { postId } = req.body;

    if (!postId || typeof postId !== "number") {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    // Check if post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    });

    if (!post) {
      return res.status(404).json({ error: "Post not found" });
    }

    // Check if user has already liked the post
    const existingLike = await prisma.like.findUnique({
      where: {
        userId_postId: {
          userId: payload.id,
          postId: postId,
        },
      },
    });

    if (existingLike) {
      // Remove like
      await prisma.like.delete({
        where: {
          userId_postId: {
            userId: payload.id,
            postId: postId,
          },
        },
      });
      return res.json({ liked: false, message: "Like removed" });
    } else {
      // Add like
      await prisma.like.create({
        data: {
          userId: payload.id,
          postId: postId,
        },
      });

      // Create notification for post author
      const user = await prisma.user.findUnique({
        where: { id: payload.id },
        select: { username: true },
      });

      if (user) {
        await createNotification(
          post.author.id,
          payload.id,
          "like",
          `${user.username} liked your post "${post.title}"`,
          postId
        );
      }

      return res.json({ liked: true, message: "Post liked" });
    }
  } catch (error) {
    console.error("Toggle like error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get likes for a post
export async function getPostLikes(req: Request, res: Response) {
  try {
    const postId = parseInt(req.params.postId);

    if (!postId) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const likes = await prisma.like.findMany({
      where: { postId },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    return res.json(likes);
  } catch (error) {
    console.error("Get post likes error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
