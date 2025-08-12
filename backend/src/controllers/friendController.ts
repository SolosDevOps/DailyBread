import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function sendRequest(req: Request, res: Response) {
  const user = req.user;
  const { toId } = req.body;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  if (!toId) return res.status(400).json({ error: "Missing toId" });
  if (user.id === toId)
    return res.status(400).json({ error: "Cannot send request to yourself" });
  try {
    const existing = await prisma.friendRequest.findFirst({
      where: { fromId: user.id, toId, status: "PENDING" },
    });
    if (existing)
      return res.status(400).json({ error: "Request already sent" });
    const request = await prisma.friendRequest.create({
      data: { fromId: user.id, toId, status: "PENDING" },
    });
    return res.status(201).json(request);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function acceptRequest(req: Request, res: Response) {
  const user = req.user;
  const requestId = Number(req.params.id);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.toId !== user.id)
      return res.status(403).json({ error: "Forbidden" });
    if (request.status !== "PENDING")
      return res.status(400).json({ error: "Request not pending" });
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "ACCEPTED" },
    });
    await prisma.friendship.create({
      data: { userA: request.fromId, userB: request.toId },
    });
    return res.json({ message: "Friend request accepted" });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function rejectRequest(req: Request, res: Response) {
  const user = req.user;
  const requestId = Number(req.params.id);
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const request = await prisma.friendRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) return res.status(404).json({ error: "Request not found" });
    if (request.toId !== user.id)
      return res.status(403).json({ error: "Forbidden" });
    if (request.status !== "PENDING")
      return res.status(400).json({ error: "Request not pending" });
    await prisma.friendRequest.update({
      where: { id: requestId },
      data: { status: "REJECTED" },
    });
    return res.json({ message: "Friend request rejected" });
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getFriends(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const friendships = await prisma.friendship.findMany({
      where: { OR: [{ userA: user.id }, { userB: user.id }] },
    });
    // Fetch unique friend IDs
    const friendIds = Array.from(
      new Set(friendships.map((f) => (f.userA === user.id ? f.userB : f.userA)))
    );
    const friends = await prisma.user.findMany({
      where: { id: { in: friendIds } },
      select: { id: true, username: true },
    });
    return res.json(friends);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}

export async function getRequests(req: Request, res: Response) {
  const user = req.user;
  if (!user) return res.status(401).json({ error: "Unauthorized" });
  try {
    const requests = await prisma.friendRequest.findMany({
      where: { toId: user.id, status: "PENDING" },
    });
    const fromIds = requests.map((r) => r.fromId);
    const senders = await prisma.user.findMany({
      where: { id: { in: fromIds } },
      select: { id: true, username: true },
    });
    const senderMap = new Map(senders.map((u) => [u.id, u]));
    const shaped = requests.map((r) => ({
      id: r.id,
      fromUser: senderMap.get(r.fromId),
      status: r.status,
      createdAt: r.createdAt,
    }));
    return res.json(shaped);
  } catch (err: any) {
    return res.status(400).json({ error: err.message });
  }
}
