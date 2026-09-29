import { db } from "@/lib/postgres";

export async function GET() {
  try {
    const result = await db.query(`SELECT name, amount::float8 AS amount, display_order AS "displayOrder", active
      FROM violation_pricing ORDER BY display_order, name`);
    return Response.json(result.rows);
  } catch (error) {
    return Response.json({ error: error instanceof Error ? error.message : "Unable to load violation pricing." }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  const client = await db.connect();
  try {
    const body = await request.json();
    if (!Array.isArray(body.prices) || !body.prices.length) {
      return Response.json({ error: "Provide at least one violation price." }, { status: 400 });
    }
    await client.query("BEGIN");
    for (const item of body.prices) {
      const name = String(item.name || "").trim();
      const amount = Number(item.amount);
      if (!name || !Number.isFinite(amount) || amount < 0) throw new Error(`Invalid penalty for ${name || "a violation"}.`);
      await client.query(`UPDATE violation_pricing SET amount=$1, updated_at=NOW() WHERE name=$2`, [amount, name]);
    }
    await client.query(`INSERT INTO audit_logs(action, entity_type, description, actor)
      VALUES('UPDATE','Violation Pricing',$1,'Super Administrator')`, [`Updated ${body.prices.length} violation penalties`]);
    await client.query("COMMIT");
    const result = await db.query(`SELECT name, amount::float8 AS amount, display_order AS "displayOrder", active
      FROM violation_pricing ORDER BY display_order, name`);
    return Response.json(result.rows);
  } catch (error) {
    await client.query("ROLLBACK");
    return Response.json({ error: error instanceof Error ? error.message : "Unable to update violation pricing." }, { status: 500 });
  } finally {
    client.release();
  }
}
