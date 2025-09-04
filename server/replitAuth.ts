import { OAuth2Client } from 'google-auth-library';
import passport from "passport";
import session from "express-session";
import type { Express, RequestHandler } from "express";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";

const hasGoogleAuth = process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET;

const client = hasGoogleAuth ? new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  process.env.GOOGLE_REDIRECT_URI || "http://localhost:5000/auth/google/callback"
) : null;

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: false,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: sessionTtl,
    },
  });
}

async function upsertUser(profile: any) {
  const nickname = profile.given_name || profile.email?.split("@")[0] || `User${profile.sub.slice(-4)}`;

  await storage.upsertUser({
    id: profile.sub,
    email: profile.email,
    firstName: profile.given_name,
    lastName: profile.family_name,
    profileImageUrl: profile.picture,
    nickname,
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  // Google OAuth login route
  app.get("/api/login", (req, res) => {
    if (!hasGoogleAuth || !client) {
      return res.status(501).json({ message: "Google authentication not configured" });
    }
    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email'
      ],
      include_granted_scopes: true,
    });
    res.redirect(authUrl);
  });

  // Google OAuth callback route
  app.get("/auth/google/callback", async (req, res) => {
    if (!hasGoogleAuth || !client) {
      return res.redirect("/");
    }
    try {
      const { code } = req.query;
      if (!code) {
        return res.redirect("/api/login");
      }

      const { tokens } = await client.getToken(code as string);
      client.setCredentials(tokens);

      const ticket = await client.verifyIdToken({
        idToken: tokens.id_token!,
        audience: process.env.GOOGLE_CLIENT_ID!,
      });

      const payload = ticket.getPayload();
      if (!payload) {
        return res.redirect("/api/login");
      }

      // Store user session
      req.session.user = {
        id: payload.sub!,
        email: payload.email || undefined,
        firstName: payload.given_name || undefined,
        lastName: payload.family_name || undefined,
        profileImageUrl: payload.picture || undefined,
        accessToken: tokens.access_token || undefined,
        refreshToken: tokens.refresh_token || undefined,
      };

      await upsertUser(payload);
      res.redirect("/");
    } catch (error) {
      console.error("Google OAuth callback error:", error);
      res.redirect("/api/login");
    }
  });

  // Logout route
  app.get("/api/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error:", err);
      }
      res.redirect("/");
    });
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const user = req.session.user;

  if (!user) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  // Add user to request object for compatibility
  req.user = {
    claims: () => ({
      sub: user.id,
      email: user.email,
      first_name: user.firstName,
      last_name: user.lastName,
      profile_image_url: user.profileImageUrl,
    })
  };

  next();
};