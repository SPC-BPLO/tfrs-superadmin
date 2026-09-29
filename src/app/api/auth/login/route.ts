import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { createSessionToken, DEMO_USER } from "@/lib/auth";

const schema = z.object({ email: z.string().email(), password: z.string().min(8) });

export async function POST(request: Request) {
  try {
    const body = schema.parse(await request.json());
    const adminEmail = (process.env.SUPER_ADMIN_EMAIL || DEMO_USER.email).toLowerCase();
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD;
    if (!adminPassword) return NextResponse.json({ error: "Super Admin credentials are not configured." }, { status: 503 });
    const passwordHash = await bcrypt.hash(adminPassword, 12);
    if (body.email.toLowerCase() !== adminEmail || !(await bcrypt.compare(body.password, passwordHash))) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    const user = { ...DEMO_USER, email: adminEmail };
    const token = await createSessionToken(user);
    const response = NextResponse.json({ user });
    response.cookies.set("tfrs_session", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 8, path: "/" });
    return response;
  } catch {
    return NextResponse.json({ error: "Please enter a valid email and password." }, { status: 400 });
  }
}
