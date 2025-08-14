import { Router } from "express";
import passport from "passport";
import { hasGoogle, hasFacebook } from "../passport";

const router = Router();

// Which providers are enabled?
router.get("/providers", (_req, res) => {
  res.json({ google: hasGoogle, facebook: hasFacebook });
});

// Initiate Google OAuth
router.get("/google", (req, res, next) => {
  if (!hasGoogle)
    return res.redirect(
      (process.env.FRONTEND_URL || "http://localhost:5173") +
        "/login?error=google_disabled"
    );
  return (
    passport.authenticate("google", {
      scope: ["profile", "email"],
      session: false,
    }) as any
  )(req, res, next);
});

// Google OAuth Callback
router.get(
  "/google/callback",
  (req, res, next) => {
    if (!hasGoogle)
      return res.redirect(
        (process.env.FRONTEND_URL || "http://localhost:5173") +
          "/login?error=google_disabled"
      );
    const failureRedirect =
      (process.env.FRONTEND_URL || "http://localhost:5173") +
      "/login?error=google_failed";
    return (
      passport.authenticate("google", {
        session: false,
        failureRedirect,
      }) as any
    )(req, res, next);
  },
  (req, res) => {
    const anyReq = req as any;
    if (anyReq.issueJwt && anyReq.user) {
      anyReq.issueJwt(res, anyReq.user);
    }
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontend}/dashboard`);
  }
);

// Initiate Facebook OAuth
router.get("/facebook", (req, res, next) => {
  if (!hasFacebook)
    return res.redirect(
      (process.env.FRONTEND_URL || "http://localhost:5173") +
        "/login?error=facebook_disabled"
    );
  return (
    passport.authenticate("facebook", {
      scope: ["email"],
      session: false,
    }) as any
  )(req, res, next);
});

// Facebook OAuth Callback
router.get(
  "/facebook/callback",
  (req, res, next) => {
    if (!hasFacebook)
      return res.redirect(
        (process.env.FRONTEND_URL || "http://localhost:5173") +
          "/login?error=facebook_disabled"
      );
    const failureRedirect =
      (process.env.FRONTEND_URL || "http://localhost:5173") +
      "/login?error=facebook_failed";
    return (
      passport.authenticate("facebook", {
        session: false,
        failureRedirect,
      }) as any
    )(req, res, next);
  },
  (req, res) => {
    const anyReq = req as any;
    if (anyReq.issueJwt && anyReq.user) {
      anyReq.issueJwt(res, anyReq.user);
    }
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontend}/dashboard`);
  }
);

export default router;
