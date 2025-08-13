import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function createPost(req: Request, res: Response) {
  const user = req.user;
  const { title, content } = req.body;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (!title || !content)
    return res.status(400).json({ error: "Missing fields" });
  try {
    const post = await prisma.post.create({
      data: {
        title,
        content,
        authorId: user.id,
      },
    });
    return res.status(201).json(post);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getPosts(req: Request, res: Response) {
  const user = req.user;

  // Require authentication to view posts
  if (!user) {
    return res
      .status(401)
      .json({ error: "Authentication required to view posts" });
  }

  try {
    console.log(`User ${user.username} (ID: ${user.id}) is requesting posts`);

    // Get list of users this user is following
    const following = await prisma.follow.findMany({
      where: { followerId: user.id },
      select: { followingId: true },
    });

    console.log(
      `User is following: ${following
        .map((f: any) => f.followingId)
        .join(", ")}`
    );

    const followingIds = following.map((f: any) => f.followingId);
    // Include user's own posts and posts from followed users
    followingIds.push(user.id);

    console.log(`Will show posts from user IDs: ${followingIds.join(", ")}`);

    const whereClause = {
      authorId: {
        in: followingIds,
      },
    };

    const posts = await prisma.post.findMany({
      where: whereClause,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { id: true, username: true, profilePicture: true } },
        likes: {
          select: {
            id: true,
            userId: true,
          },
        },
        comments: {
          select: {
            id: true,
            content: true,
            createdAt: true,
            userId: true,
            user: {
              select: {
                id: true,
                username: true,
                profilePicture: true,
              },
            },
          },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });

    console.log(
      `Returning ${posts.length} posts. Post authors: ${posts
        .map((p) => `${p.author.username} (ID: ${p.author.id})`)
        .join(", ")}`
    );

    return res.json(posts);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getPostById(req: Request, res: Response) {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  try {
    const post = await prisma.post.findUnique({
      where: { id },
      include: {
        author: { select: { id: true, username: true, profilePicture: true } },
        likes: {
          include: {
            user: {
              select: { id: true, username: true, profilePicture: true },
            },
          },
        },
        comments: {
          include: {
            user: {
              select: { id: true, username: true, profilePicture: true },
            },
          },
          orderBy: { createdAt: "asc" },
        },
        _count: {
          select: {
            likes: true,
            comments: true,
          },
        },
      },
    });
    if (!post) return res.status(404).json({ error: "Not found" });
    return res.json(post);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function updatePost(req: Request, res: Response) {
  const user = req.user;
  const id = Number(req.params.id);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (Number.isNaN(id)) return res.status(400).json({ error: "Invalid id" });
  const { title, content } = req.body || {};
  if (!title && !content)
    return res.status(400).json({ error: "Nothing to update" });
  try {
    const existing = await prisma.post.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: "Post not found" });
    if (existing.authorId !== user.id)
      return res.status(403).json({ error: "Forbidden" });
    const updated = await prisma.post.update({
      where: { id },
      data: {
        ...(title ? { title } : {}),
        ...(content ? { content } : {}),
      },
      include: { author: { select: { id: true, username: true } } },
    });
    return res.json(updated);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function deletePost(req: Request, res: Response) {
  const user = req.user;
  const postId = Number(req.params.id);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const post = await prisma.post.findUnique({ where: { id: postId } });
    if (!post) return res.status(404).json({ error: "Post not found" });
    if (post.authorId !== user.id)
      return res.status(403).json({ error: "Forbidden" });

    // Delete post and all related data in a transaction
    await prisma.$transaction(async (tx) => {
      // Delete all likes for this post
      await tx.like.deleteMany({
        where: { postId: postId },
      });

      // Delete all comments for this post
      await tx.comment.deleteMany({
        where: { postId: postId },
      });

      // Finally delete the post
      await tx.post.delete({
        where: { id: postId },
      });
    });

    return res.json({ message: "Post deleted" });
  } catch (err: any) {
    console.error("Delete post error:", err);
    return res.status(400).json({ error: err.message });
  }
}
