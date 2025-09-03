import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import { createNotification } from "./notificationController";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// Create a comment on a post
export async function createComment(req: Request, res: Response) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { postId, content } = req.body;

    if (!postId || typeof postId !== "number") {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    if (content.length > 500) {
      return res
        .status(400)
        .json({ error: "Comment too long (max 500 characters)" });
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

    const comment = await prisma.comment.create({
      data: {
        content: content.trim(),
        userId: payload.id,
        postId: postId,
      },
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

    // Create notification for post author
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
      select: { username: true },
    });

    if (user) {
      await createNotification(
        post.author.id,
        payload.id,
        "comment",
        `${user.username} commented on your post "${post.title}"`,
        postId
      );
    }

    return res.status(201).json(comment);
  } catch (error) {
    console.error("Create comment error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Get comments for a post
export async function getPostComments(req: Request, res: Response) {
  try {
    const postId = parseInt(req.params.id);

    if (!postId || isNaN(postId)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const comments = await prisma.comment.findMany({
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
      orderBy: { createdAt: "asc" },
    });

    return res.json(comments);
  } catch (error) {
    console.error("Get post comments error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

// Delete a comment
export async function deleteComment(req: Request, res: Response) {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const commentId = parseInt(req.params.commentId);

    if (!commentId) {
      return res.status(400).json({ error: "Invalid comment ID" });
    }

    // Check if comment exists and user owns it
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    if (comment.userId !== payload.id) {
      return res
        .status(403)
        .json({ error: "Not authorized to delete this comment" });
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return res.json({ message: "Comment deleted successfully" });
  } catch (error) {
    console.error("Delete comment error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
