import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

// Follow controller with Prisma client - updated
const prisma = new PrismaClient();

export async function followUser(req: Request, res: Response) {
  const user = req.user;
  const { userId } = req.params;

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const targetUserId = parseInt(userId);
  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  if (user.id === targetUserId) {
    return res.status(400).json({ error: "Cannot follow yourself" });
  }

  try {
    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      return res.status(400).json({ error: "Already following this user" });
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: user.id,
        followingId: targetUserId,
      },
    });

    res.json({ message: "Successfully followed user" });
  } catch (error: any) {
    console.error("Follow error:", error);
    res.status(500).json({ error: "Failed to follow user" });
  }
}

export async function unfollowUser(req: Request, res: Response) {
  const user = req.user;
  const { userId } = req.params;

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const targetUserId = parseInt(userId);
  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    // Delete follow relationship
    const deletedFollow = await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    res.json({ message: "Successfully unfollowed user" });
  } catch (error: any) {
    if (error.code === "P2025") {
      return res.status(400).json({ error: "Not following this user" });
    }
    console.error("Unfollow error:", error);
    res.status(500).json({ error: "Failed to unfollow user" });
  }
}

export async function getFollowStatus(req: Request, res: Response) {
  const user = req.user;
  const { userId } = req.params;

  if (!user) return res.status(401).json({ error: "Unauthorized" });

  const targetUserId = parseInt(userId);
  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: user.id,
          followingId: targetUserId,
        },
      },
    });

    res.json({ isFollowing: !!follow });
  } catch (error: any) {
    console.error("Follow status error:", error);
    res.status(500).json({ error: "Failed to get follow status" });
  }
}

export async function getFollowers(req: Request, res: Response) {
  const { userId } = req.params;

  const targetUserId = parseInt(userId);
  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const followers = await prisma.follow.findMany({
      where: { followingId: targetUserId },
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    res.json(followers.map((f: any) => f.follower));
  } catch (error: any) {
    console.error("Get followers error:", error);
    res.status(500).json({ error: "Failed to get followers" });
  }
}

export async function getFollowing(req: Request, res: Response) {
  const { userId } = req.params;

  const targetUserId = parseInt(userId);
  if (isNaN(targetUserId)) {
    return res.status(400).json({ error: "Invalid user ID" });
  }

  try {
    const following = await prisma.follow.findMany({
      where: { followerId: targetUserId },
      include: {
        following: {
          select: {
            id: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });

    res.json(following.map((f: any) => f.following));
  } catch (error: any) {
    console.error("Get following error:", error);
    res.status(500).json({ error: "Failed to get following" });
  }
}
