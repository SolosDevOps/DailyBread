import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Helper function to check friendship status
async function getFriendshipStatus(userId1: number, userId2: number) {
  // Check if they are friends
  const friendship = await prisma.friendship.findFirst({
    where: {
      OR: [
        { userA: userId1, userB: userId2 },
        { userA: userId2, userB: userId1 },
      ],
    },
  });

  if (friendship) {
    return "FRIENDS";
  }

  // Check for pending requests
  const pendingRequest = await prisma.friendRequest.findFirst({
    where: {
      OR: [
        { fromId: userId1, toId: userId2, status: "PENDING" },
        { fromId: userId2, toId: userId1, status: "PENDING" },
      ],
    },
  });

  if (pendingRequest) {
    if (pendingRequest.fromId === userId1) {
      return "REQUEST_SENT";
    } else {
      return "REQUEST_RECEIVED";
    }
  }

  return "NONE";
}

export async function getUserById(req: Request, res: Response) {
  const userId = Number(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Count posts separately
    const postsCount = await prisma.post.count({
      where: { authorId: userId },
    });

    // Transform the response to match frontend expectations
    const transformedUser = {
      id: user.id,
      username: user.username,
      bio: user.bio,
      profilePicture: null, // TODO: Add after Prisma regeneration
      createdAt: user.createdAt,
      postsCount: postsCount,
      friendsCount: 0, // TODO: Implement proper friend counting
    };

    return res.json(transformedUser);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getUserPosts(req: Request, res: Response) {
  const userId = Number(req.params.id);
  if (isNaN(userId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const posts = await prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      include: {
        author: {
          select: { id: true, username: true },
        },
      },
    });

    return res.json(posts);
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getUserStats(req: Request, res: Response) {
  const userId = Number(req.params.id);
  if (isNaN(userId)) return res.status(400).json({ error: "Invalid user ID" });
  try {
    const [posts, friends] = await Promise.all([
      prisma.post.count({ where: { authorId: userId } }),
      prisma.friendship.count({
        where: { OR: [{ userA: userId }, { userB: userId }] },
      }),
    ]);
    // Placeholder metrics until models exist
    const prayers = 0; // TODO: implement Prayer model or derive metric
    const blessings = 0; // TODO: implement Blessing / reactions metric
    return res.json({ posts, friends, prayers, blessings });
  } catch (err: any) {
    return res.status(500).json({ error: err.message });
  }
}
