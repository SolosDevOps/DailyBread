import { Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { PrismaClient, User } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change_me";

function getSafeUser(user: User) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export async function register(req: Request, res: Response) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    // Check if user already exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email: email }, { username: username }],
      },
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return res.status(400).json({ error: "Email already in use" });
      }
      if (existingUser.username === username) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });
    // Issue auth cookie on successful registration
    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, { httpOnly: true, sameSite: "lax", path: "/" });
    return res.status(201).json(getSafeUser(user));
  } catch (err: any) {
    console.error("Registration error:", err);
    return res.status(400).json({ error: "Registration failed" });
  }
}

export async function login(req: Request, res: Response) {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: "Missing fields" });
  }
  try {
    // Look for user by either username or email
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ username: username }, { email: username }],
      },
    });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    res.cookie("token", token, { httpOnly: true, sameSite: "lax", path: "/" });
    return res.json(getSafeUser(user));
  } catch (err: any) {
    console.error("Login error:", err);
    return res.status(400).json({ error: "Login failed" });
  }
}

export async function me(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });
  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(404).json({ error: "User not found" });
    return res.json(getSafeUser(user));
  } catch (err: any) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

export function logout(req: Request, res: Response) {
  res.clearCookie("token");
  return res.json({ message: "Logged out" });
}

export async function updateProfile(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { username, email, bio } = req.body;

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: payload.id },
    });
    if (!existingUser) return res.status(404).json({ error: "User not found" });

    // Check if new username/email is already taken by another user
    if (username && username !== existingUser.username) {
      const usernameExists = await prisma.user.findUnique({
        where: { username },
      });
      if (usernameExists) {
        return res.status(400).json({ error: "Username already taken" });
      }
    }

    if (email && email !== existingUser.email) {
      const emailExists = await prisma.user.findUnique({ where: { email } });
      if (emailExists) {
        return res.status(400).json({ error: "Email already taken" });
      }
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: payload.id },
      data: {
        ...(username && { username }),
        ...(email && { email }),
        ...(bio !== undefined && { bio }),
      },
    });

    return res.json(getSafeUser(updatedUser));
  } catch (err: any) {
    console.error("Profile update error:", err);
    return res.status(400).json({ error: "Profile update failed" });
  }
}

export async function updatePassword(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ error: "Current password and new password are required" });
    }

    if (newPassword.length < 6) {
      return res
        .status(400)
        .json({ error: "New password must be at least 6 characters" });
    }

    // Get user with password
    const user = await prisma.user.findUnique({ where: { id: payload.id } });
    if (!user) return res.status(404).json({ error: "User not found" });

    // Verify current password
    const isCurrentPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ error: "Current password is incorrect" });
    }

    // Hash new password and update
    const hashedNewPassword = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: payload.id },
      data: { password: hashedNewPassword },
    });

    return res.json({ message: "Password updated successfully" });
  } catch (err: any) {
    console.error("Password update error:", err);
    return res.status(400).json({ error: "Password update failed" });
  }
}

export async function updateProfilePicture(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { profilePicture } = req.body;

    // Update user profile picture
    const updatedUser = await (prisma as any).user.update({
      where: { id: payload.id },
      data: { profilePicture },
    });

    return res.json(getSafeUser(updatedUser));
  } catch (err: any) {
    console.error("Profile picture update error:", err);
    return res.status(400).json({ error: "Profile picture update failed" });
  }
}

export async function updateCoverImage(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { coverImage, coverImagePosition } = req.body;

    // Update user cover image
    const updatedUser = await (prisma as any).user.update({
      where: { id: payload.id },
      data: {
        coverImage,
        coverImagePosition: coverImagePosition || null,
      },
    });

    return res.json(getSafeUser(updatedUser));
  } catch (err: any) {
    console.error("Cover image update error:", err);
    return res.status(400).json({ error: "Cover image update failed" });
  }
}

export async function deleteAccount(req: Request, res: Response) {
  const token = req.cookies.token;
  if (!token) return res.status(401).json({ error: "Not authenticated" });

  try {
    const payload = jwt.verify(token, JWT_SECRET) as { id: number };
    const { password } = req.body;

    if (!password) {
      return res
        .status(400)
        .json({ error: "Password is required to delete account" });
    }

    // Verify current password
    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(400).json({ error: "Invalid password" });
    }

    // Delete user and all related data (cascade delete)
    // Prisma will handle the cascade deletion based on the schema relationships
    await prisma.$transaction(async (tx) => {
      // Delete user's notifications (both received and triggered)
      await tx.notification.deleteMany({
        where: {
          OR: [{ userId: payload.id }, { triggeredBy: payload.id }],
        },
      });

      // Delete user's follows (both as follower and following)
      await tx.follow.deleteMany({
        where: {
          OR: [{ followerId: payload.id }, { followingId: payload.id }],
        },
      });

      // Delete user's friendships
      await tx.friendship.deleteMany({
        where: {
          OR: [{ userA: payload.id }, { userB: payload.id }],
        },
      });

      // Delete user's friend requests
      await tx.friendRequest.deleteMany({
        where: {
          OR: [{ fromId: payload.id }, { toId: payload.id }],
        },
      });

      // Delete user's comments
      await tx.comment.deleteMany({
        where: { userId: payload.id },
      });

      // Delete user's likes
      await tx.like.deleteMany({
        where: { userId: payload.id },
      });

      // Delete user's posts (this will also delete related likes, comments, and notifications)
      await tx.post.deleteMany({
        where: { authorId: payload.id },
      });

      // Finally, delete the user
      await tx.user.delete({
        where: { id: payload.id },
      });
    });

    // Clear the authentication cookie
    res.clearCookie("token", { httpOnly: true, sameSite: "lax", path: "/" });

    return res.json({ message: "Account deleted successfully" });
  } catch (err: any) {
    console.error("Account deletion error:", err);
    return res.status(500).json({ error: "Account deletion failed" });
  }
}
