import {userDb} from '@/lib/user-db';
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { verifySession } from "@/lib/auth";
import { db } from "@/lib/postgres";

export const dynamic = "force-dynamic";

const money = (value: unknown) => `₱${Number(value || 0).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`;
const date = (value: unknown) => value ? new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(new Date(String(value))) : "—";

async function rows(primary: string, fallback?: string) {
  try { return (await db.query(primary)).rows; }
  catch (error) {
    const code = (error as { code?: string }).code;
    if (fallback && (code === "42P01" || code === "42703")) return (await db.query(fallback)).rows;
    if (code === "42P01") return [];
    throw error;
  }
}

export async function GET() {
  const session = await verifySession((await cookies()).get("tfrs_session")?.value);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const [franchises, violations, renewals, audits, transactions, archive] = await Promise.all([
      rows(`SELECT f.*, COALESCE(v.count, 0)::int AS violation_count FROM franchise_registry f LEFT JOIN (SELECT franchise_no, COUNT(*) count FROM violations GROUP BY franchise_no) v ON v.franchise_no = f.mtop ORDER BY f.updated_at DESC`, `SELECT *, 0::int AS violation_count FROM franchise_registry ORDER BY updated_at DESC`),
      rows(`SELECT * FROM violations ORDER BY created_at DESC`),
      rows(`SELECT * FROM franchise_renewals ORDER BY updated_at DESC`),
      rows(`SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 250`),
      rows(`SELECT * FROM franchise_transactions ORDER BY created_at DESC`),
      rows(`SELECT * FROM franchise_archive ORDER BY created_at DESC`),
    ]);
    const clients = franchises.map((r) => ({ mtop:r.mtop, owner:r.operator_name || [r.owner_first_name,r.owner_middle_name,r.owner_last_name].filter(Boolean).join(" "), driver:r.driver_name, license:r.driver_license, vehicle:r.vehicle, plate:r.plate_no, toda:r.toda, route:r.route_name||"—", contact:r.owner_contact, due:date(r.renewal_due), status:r.renewal_due&&new Date(r.renewal_due)<new Date()?"For renewal":"Active", violations:r.violation_count }));
    const violationRows = violations.map((r) => ({ ticket:r.ticket, violator:r.violator_name, officer:r.officer, date:r.apprehension_date, license:r.license_no, address:r.address, vehicle:r.vehicle, plate:r.plate_no, mtop:r.franchise_no||"—", violation:r.violations_committed, amount:money(r.amount), amountValue:Number(r.amount), status:r.status, or:r.or_number||"—", payor:r.payor||r.violator_name, paymentDate:r.payment_date||"—", createdAt:r.created_at }));
    const renewalRows = renewals.map((r) => ({ mtop:r.mtop, client:r.client_name, toda:r.toda, driver:r.driver_name, plate:r.plate_no, expiry:date(r.current_expiry), status:r.status, date:date(r.renewal_date), reference:r.reference_no||"—", renewalDate:r.renewal_date, createdAt:r.created_at }));
    const payments = violationRows.filter((r) => r.status === "Settled").map((r) => ({ ticket:r.ticket, payor:r.payor, violation:r.violation, due:r.amount, paid:r.amount, or:r.or, status:"Paid", date:r.paymentDate }));
    let accessLogs:Record<string,unknown>[]=[];
    try{accessLogs=(await userDb.query('SELECT * FROM account_access_logs ORDER BY created_at DESC LIMIT 250')).rows;}
    catch(error){if((error as {code?:string}).code!=='42P01')throw error;}
    const accessRows=accessLogs.map(r=>({time:new Intl.DateTimeFormat('en-PH',{dateStyle:'medium',timeStyle:'medium',timeZone:'Asia/Manila'}).format(new Date(String(r.created_at))),createdAt:r.created_at,user:String(r.user_name),office:String(r.office),role:String(r.role),action:String(r.action),module:'Account access',record:r.user_id,description:'Successful login • '+r.browser+' • '+r.device_name,ip:String(r.ip_address||'Local / unavailable')}));
    const auditRows = audits.map((r) => ({ time:date(r.created_at), createdAt:r.created_at, user:r.actor, office:r.entity_type, role:"System user", action:r.action, module:r.entity_type, record:r.entity_id||"—", description:r.description, ip:"—" })).concat(accessRows).sort((a,b)=>new Date(String(b.createdAt)).getTime()-new Date(String(a.createdAt)).getTime()).slice(0,250);
    const transfers = transactions.filter((r) => String(r.transaction_type).toLowerCase().includes("transfer")).map((r) => ({
      mtop:r.mtop, previous:r.operator_name, newOwner:r.operator_name, change:r.transaction_type,
      date:date(r.processed_at), reference:r.reference_no, status:r.status,
    }));
    const archived = archive.map((r) => ({
      mtop:r.mtop, owner:r.operator_name, driver:r.driver_name, vehicle:r.vehicle, plate:r.plate_no,
      toda:r.toda, type:r.kind === "renewed" ? "Renewal" : r.kind, date:date(r.processed_on),
      reference:r.reference_no, change:r.change_label || r.transfer_scope || "—", amount:money(r.amount),
    }));
    const franchiseTransactions = transactions.map((r) => ({
      reference:r.reference_no, mtop:r.mtop, type:r.transaction_type, client:r.operator_name,
      amount:money(r.amount), amountValue:Number(r.amount), status:r.status, processedBy:r.processed_by, date:date(r.processed_at), processedAt:r.processed_at, remarks:r.remarks||"—",
    }));
    return NextResponse.json({ clients, violations:violationRows, renewals:renewalRows, payments, audits:auditRows, transfers, archived, franchiseTransactions });
  } catch (error) {
    console.error("system-data", error);
    const message = error instanceof Error ? error.message : "Unknown PostgreSQL error";
    return NextResponse.json({ error:`Unable to read the shared PostgreSQL database: ${message}` }, { status:500 });
  }
}
