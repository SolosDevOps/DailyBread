import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth";
import postsRoutes from "./routes/posts";
import friendsRoutes from "./routes/friends";
import searchRoutes from "./routes/search";
import usersRoutes from "./routes/users";
import likesRoutes from "./routes/likes";
import commentsRoutes from "./routes/comments";
import followRoutes from "./routes/follow";
import notificationRoutes from "./routes/notifications";
import oauthRoutes from "./routes/oauthRoutes";
import bibleRoutes from "./routes/bible";
import { cleanupSeenNotifications } from "./controllers/notificationController";
import { passportSessionlessInit } from "./passport";

const app = express();

app.use(cookieParser());
// CORS: allow dev hosts (localhost/127.0.0.1 on any port) and FRONTEND_URL
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";
const allowed = new Set([
  FRONTEND_URL,
  "http://localhost:5173",
  "http://localhost:5174",
  "http://127.0.0.1:5173",
  "http://127.0.0.1:5174",
]);
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        allowed.has(origin) ||
        /^http:\/\/localhost:\d+$/.test(origin) ||
        /^http:\/\/127\.0\.0\.1:\d+$/.test(origin)
      ) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
  })
);
app.use(express.json());
// Initialize OAuth providers (passport)
passportSessionlessInit(app);

// Route mounts
app.use("/api/auth", authRoutes);
app.use("/api/auth/oauth", oauthRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/follow", followRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/bible", bibleRoutes);

const router = express.Router();

router.get("/health", (req: Request, res: Response) => {
  res.json({ ok: true });
});

app.use("/api", router);

// Centralized error handler
// eslint-disable-next-line @typescript-eslint/no-unused-vars
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Unhandled error:", err);
  if (res.headersSent) return;
  const status = typeof err?.status === "number" ? err.status : 500;
  const message =
    status === 500 ? "Internal Server Error" : err.message || "Error";
  res.status(status).json({ error: message });
});

// Shared JWT cookie options
export const jwtCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: false, // set true behind HTTPS / production
  maxAge: 7 * 24 * 3600 * 1000,
};

export { app };

if (require.main === module) {
  const PORT = process.env.PORT || 4001;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);

    // Run cleanup every hour
    setInterval(cleanupSeenNotifications, 60 * 60 * 1000);
  });
}
