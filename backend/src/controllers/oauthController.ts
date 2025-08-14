import { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change_me";

// Deprecated: using Passport-based server-side OAuth flow instead.
export {};
