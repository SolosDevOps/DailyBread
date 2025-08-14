import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as FacebookStrategy } from "passport-facebook";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || "change_me";

function attachJwtIssuer(req: any) {
  req.issueJwt = (res: any, payload: { id: number; username: string }) => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
    res.cookie("token", token, { httpOnly: true, sameSite: "lax", path: "/" });
  };
}

export const hasGoogle =
  !!process.env.GOOGLE_CLIENT_ID && !!process.env.GOOGLE_CLIENT_SECRET;
if (hasGoogle) {
  console.log(
    `Google OAuth enabled; callback: ${
      (process.env.API_URL || "http://localhost:4001") +
      "/api/auth/oauth/google/callback"
    }`
  );
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
        callbackURL:
          (process.env.API_URL || "http://localhost:4001") +
          "/api/auth/oauth/google/callback",
      },
      async (
        _accessToken: any,
        _refreshToken: any,
        profile: any,
        done: any
      ) => {
        try {
          const googleId = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || email?.split("@")[0] || "user";
          const picture = profile.photos?.[0]?.value;

          let user = await (prisma as any).user.findFirst({
            where: { googleId },
          });
          if (!user && email) {
            const byEmail = await prisma.user.findUnique({ where: { email } });
            if (byEmail) {
              user = await (prisma as any).user.update({
                where: { id: byEmail.id },
                data: {
                  googleId,
                  profilePicture:
                    byEmail.profilePicture || picture || undefined,
                },
              });
            }
          }
          if (!user) {
            const base = name.replace(/\s+/g, "").toLowerCase();
            let username = base;
            let i = 1;
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const exists = await prisma.user.findUnique({
                where: { username },
              });
              if (!exists) break;
              i += 1;
              username = `${base}${i}`;
            }
            user = await (prisma as any).user.create({
              data: {
                username,
                email: email || `google-${googleId}@example.com`,
                password: "oauth",
                googleId,
                profilePicture: picture || null,
              },
            });
          }
          return done(null, { id: user.id, username: user.username });
        } catch (e) {
          return done(e as any);
        }
      }
    )
  );
} else {
  console.warn(
    "Google OAuth disabled: missing GOOGLE_CLIENT_ID/GOOGLE_CLIENT_SECRET"
  );
}

export const hasFacebook =
  !!process.env.FACEBOOK_CLIENT_ID && !!process.env.FACEBOOK_CLIENT_SECRET;
if (hasFacebook) {
  console.log(
    `Facebook OAuth enabled; callback: ${
      (process.env.API_URL || "http://localhost:4001") +
      "/api/auth/oauth/facebook/callback"
    }`
  );
  passport.use(
    new (FacebookStrategy as any)(
      {
        clientID: process.env.FACEBOOK_CLIENT_ID as string,
        clientSecret: process.env.FACEBOOK_CLIENT_SECRET as string,
        callbackURL:
          (process.env.API_URL || "http://localhost:4001") +
          "/api/auth/oauth/facebook/callback",
        profileFields: ["id", "displayName", "emails", "photos"],
      },
      async (
        _accessToken: any,
        _refreshToken: any,
        profile: any,
        done: any
      ) => {
        try {
          const facebookId = profile.id;
          const email = profile.emails?.[0]?.value;
          const name = profile.displayName || email?.split("@")[0] || "user";
          const picture = profile.photos?.[0]?.value;

          let user = await (prisma as any).user.findFirst({
            where: { facebookId },
          });
          if (!user && email) {
            const byEmail = await prisma.user.findUnique({ where: { email } });
            if (byEmail) {
              user = await (prisma as any).user.update({
                where: { id: byEmail.id },
                data: {
                  facebookId,
                  profilePicture:
                    byEmail.profilePicture || picture || undefined,
                },
              });
            }
          }
          if (!user) {
            const base = name.replace(/\s+/g, "").toLowerCase();
            let username = base;
            let i = 1;
            // eslint-disable-next-line no-constant-condition
            while (true) {
              const exists = await prisma.user.findUnique({
                where: { username },
              });
              if (!exists) break;
              i += 1;
              username = `${base}${i}`;
            }
            user = await (prisma as any).user.create({
              data: {
                username,
                email: email || `facebook-${facebookId}@example.com`,
                password: "oauth",
                facebookId,
                profilePicture: picture || null,
              },
            });
          }
          return done(null, { id: user.id, username: user.username });
        } catch (e) {
          return done(e as any);
        }
      }
    )
  );
} else {
  console.warn(
    "Facebook OAuth disabled: missing FACEBOOK_CLIENT_ID/FACEBOOK_CLIENT_SECRET"
  );
}

export function passportSessionlessInit(app: import("express").Express) {
  app.use(passport.initialize());
  app.use((req, _res, next) => {
    attachJwtIssuer(req);
    next();
  });
}

export default passport;
