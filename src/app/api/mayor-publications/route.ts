import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/postgres";

export const dynamic = "force-dynamic";

const publication = z.object({
  metricKey: z.string().min(1).max(80),
  label: z.string().min(1).max(120),
  value: z.string().max(80),
  detail: z.string().max(180),
  source: z.string().max(60),
});

async function authorized() {
  return verifySession((await cookies()).get("tfrs_session")?.value);
}

async function ensureTable() {
  await db.query(`CREATE TABLE IF NOT EXISTS mayor_publications (
    metric_key VARCHAR(80) PRIMARY KEY,
    label VARCHAR(120) NOT NULL,
    value VARCHAR(80) NOT NULL,
    detail VARCHAR(180) NOT NULL,
    source VARCHAR(60) NOT NULL,
    published_by VARCHAR(180) NOT NULL,
    published_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`);
}

export async function GET() {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();
  const result = await db.query("SELECT * FROM mayor_publications ORDER BY published_at DESC");
  return NextResponse.json({ data: result.rows });
}

export async function POST(request: NextRequest) {
  const user = await authorized();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const input = publication.parse(await request.json());
  await ensureTable();
  await db.query(`INSERT INTO mayor_publications
    (metric_key,label,value,detail,source,published_by,published_at)
    VALUES ($1,$2,$3,$4,$5,$6,CURRENT_TIMESTAMP)
    ON CONFLICT (metric_key) DO UPDATE SET label=EXCLUDED.label,value=EXCLUDED.value,
    detail=EXCLUDED.detail,source=EXCLUDED.source,published_by=EXCLUDED.published_by,published_at=CURRENT_TIMESTAMP`,
    [input.metricKey,input.label,input.value,input.detail,input.source,user.name]);
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: NextRequest) {
  if (!(await authorized())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await ensureTable();
  const metricKey = new URL(request.url).searchParams.get("metricKey");
  if (!metricKey) return NextResponse.json({ error: "metricKey is required" }, { status: 400 });
  await db.query("DELETE FROM mayor_publications WHERE metric_key=$1", [metricKey]);
  return NextResponse.json({ ok: true });
}
