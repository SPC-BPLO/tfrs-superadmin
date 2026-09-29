import { SignJWT, jwtVerify } from "jose";

export type SessionUser = { id: string; name: string; email: string; role: string; office: string; permissions: string[] };
const key = new TextEncoder().encode(process.env.AUTH_SECRET || "tfrs-local-development-secret-change-in-production");

export async function createSessionToken(user: SessionUser) {
  return new SignJWT(user).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("8h").sign(key);
}

export async function verifySession(token?: string) {
  if (!token) return null;
  try { return (await jwtVerify(token, key)).payload as unknown as SessionUser; } catch { return null; }
}

export const DEMO_USER: SessionUser = {
  id: "super-admin-001", name: "Maria Santos", email: "admin@tfrs.gov.ph", role: "Super Admin", office: "System Administration", permissions: ["*"]
};
