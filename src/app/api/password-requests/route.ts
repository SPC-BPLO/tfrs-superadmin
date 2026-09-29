import {cookies} from "next/headers";
import {NextResponse} from "next/server";
import {z} from "zod";
import {verifySession} from "@/lib/auth";
import {ensureSystemUsers,userDb} from "@/lib/user-db";
async function admin(){return verifySession((await cookies()).get("tfrs_session")?.value)}
export async function GET(){const user=await admin();if(!user||!user.permissions.includes("*"))return NextResponse.json({error:"Super Admin access required."},{status:403});await ensureSystemUsers();const result=await userDb.query(`SELECT p.id,p.user_id AS "userId",u.full_name AS name,p.email,p.office,p.status,TO_CHAR(p.requested_at,'YYYY-MM-DD HH24:MI') AS "requestedAt",COALESCE(p.reviewed_by,'—') AS "reviewedBy" FROM password_change_requests p JOIN system_users u ON u.id=p.user_id ORDER BY CASE p.status WHEN 'PENDING' THEN 0 ELSE 1 END,p.requested_at DESC`);return NextResponse.json(result.rows,{headers:{"Cache-Control":"no-store"}})}
const schema=z.object({id:z.coerce.number().int().positive(),action:z.enum(["APPROVE","REJECT"])});
export async function PATCH(request:Request){const user=await admin();if(!user||!user.permissions.includes("*"))return NextResponse.json({error:"Super Admin access required."},{status:403});try{const input=schema.parse(await request.json());await ensureSystemUsers();const status=input.action==="APPROVE"?"APPROVED":"REJECTED";await userDb.query(`UPDATE password_change_requests SET status=$1,reviewed_at=CURRENT_TIMESTAMP,reviewed_by=$2 WHERE id=$3 AND status='PENDING'`,[status,user.email,input.id]);return NextResponse.json({ok:true,status})}catch{return NextResponse.json({error:"Invalid password request update."},{status:400})}}
