import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "swallow_this_admin";

function secret() {
  return process.env.ADMIN_PASSWORD || "dev-password";
}

function signature(value: string) {
  return createHmac("sha256", secret()).update(value).digest("hex");
}

function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function isAdminAuthenticated() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;
  if (!token) return false;
  const [value, sig] = token.split(".");
  return value === "admin" && Boolean(sig) && safeEqual(signature(value), sig);
}

export async function setAdminCookie() {
  const value = "admin";
  (await cookies()).set(COOKIE_NAME, `${value}.${signature(value)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearAdminCookie() {
  (await cookies()).delete(COOKIE_NAME);
}

export function verifyPassword(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return password === "dev-password";
  return safeEqual(password, expected);
}
