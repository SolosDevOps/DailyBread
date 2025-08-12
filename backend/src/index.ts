import express, { Request, Response, NextFunction } from "express";
import cookieParser from "cookie-parser";
import cors from "cors";

import authRoutes from "./routes/auth";
import postsRoutes from "./routes/posts";
import friendsRoutes from "./routes/friends";
import searchRoutes from "./routes/search";
import usersRoutes from "./routes/users";
import likesRoutes from "./routes/likes";
import commentsRoutes from "./routes/comments";

const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: ["http://localhost:5173", "http://localhost:5174"],
    credentials: true,
  })
);
app.use(express.json());

// Route mounts
app.use("/api/auth", authRoutes);
app.use("/api/posts", postsRoutes);
app.use("/api/friends", friendsRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/likes", likesRoutes);
app.use("/api/comments", commentsRoutes);

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
  });
}
