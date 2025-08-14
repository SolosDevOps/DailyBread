import { Router } from "express";
import passport from "passport";

const router = Router();

// Initiate Google OAuth
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  })
);

// Google OAuth Callback
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const anyReq = req as any;
    if (anyReq.issueJwt && anyReq.userPayload) {
      anyReq.issueJwt(res, anyReq.userPayload);
    }
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontend}/dashboard`);
  }
);

// Initiate Facebook OAuth
router.get(
  "/facebook",
  passport.authenticate("facebook", { scope: ["email"], session: false })
);

// Facebook OAuth Callback
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const anyReq = req as any;
    if (anyReq.issueJwt && anyReq.userPayload) {
      anyReq.issueJwt(res, anyReq.userPayload);
    }
    const frontend = process.env.FRONTEND_URL || "http://localhost:5173";
    res.redirect(`${frontend}/dashboard`);
  }
);

export default router;
