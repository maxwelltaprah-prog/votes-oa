import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { ConfigError, db } from "@/lib/supabase";

export interface Session {
  sub: string; // employee id
  name: string;
  email: string;
  isAdmin: boolean; // as of sign-in; admin-only routes re-check the database via requireAdmin()
}

const COOKIE = "np_session";
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function secret() {
  const s = (process.env.SESSION_SECRET || "").trim();
  if (!s) throw new ConfigError("SESSION_SECRET is not set.");
  if (s.length < 16) {
    throw new ConfigError(`SESSION_SECRET is too short (${s.length} characters; it needs at least 16).`);
  }
  return new TextEncoder().encode(s);
}

export async function createSession(session: Session) {
  const token = await new SignJWT({ ...session })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(secret());

  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSession() {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    if (!payload.sub) return null;
    return {
      sub: String(payload.sub),
      name: String(payload.name),
      email: String(payload.email),
      isAdmin: payload.isAdmin === true,
    };
  } catch {
    return null;
  }
}

/**
 * For admin-only routes. Checks the signed-in employee is *currently* an admin in the database,
 * so removing someone's admin rights takes effect immediately instead of when their cookie expires.
 */
export async function requireAdmin(): Promise<Session | null> {
  const s = await getSession();
  if (!s) return null;
  const { data } = await db().from("employees").select("is_admin").eq("id", s.sub).maybeSingle();
  return data?.is_admin === true ? { ...s, isAdmin: true } : null;
}
