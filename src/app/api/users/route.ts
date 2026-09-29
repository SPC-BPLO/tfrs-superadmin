import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { ensureSystemUsers, userDb } from "@/lib/user-db";

async function admin(){return verifySession((await cookies()).get("tfrs_session")?.value)}
const schema=z.object({id:z.coerce.number().int().positive(),action:z.enum(["SAVE","APPROVE","DISABLE","ACTIVATE","REJECT","RESET_DEVICES","APPROVE_PASSWORD","FINALIZE_PASSWORD","REJECT_PASSWORD"]),office:z.enum(["CTMO","FINANCE","BOTH"]).optional(),role:z.string().trim().min(2).max(80).optional(),requestId:z.preprocess(value=>value===null||value===""?undefined:value,z.coerce.number().int().positive().optional())});

export async function GET(){
  const a=await admin();if(!a||(a.role!=="Super Admin"&&!a.permissions.includes("*")))return NextResponse.json({error:"Super Admin access is required."},{status:403});await ensureSystemUsers();
  const result=await userDb.query(`SELECT u.id,u.full_name name,u.email,u.requested_office "requestedOffice",COALESCE(u.approved_office,'—') office,COALESCE(u.role,'Unassigned') role,u.status,COALESCE(TO_CHAR(u.last_login,'YYYY-MM-DD HH24:MI'),'Never') "lastLogin",TO_CHAR(u.created_at,'YYYY-MM-DD HH24:MI') "createdAt",COALESCE(u.approved_by,'—') "approvedBy",p.id "passwordRequestId",p.status "passwordRequestStatus",TO_CHAR(p.requested_at,'YYYY-MM-DD HH24:MI') "passwordRequestedAt",COALESCE(d.devices,0)::int "deviceCount",COALESCE(d.latest_device,'No recorded device') "latestDevice",COALESCE(d.device_list,'[]'::json) devices FROM system_users u LEFT JOIN LATERAL(SELECT * FROM password_change_requests x WHERE x.user_id=u.id ORDER BY x.requested_at DESC LIMIT 1)p ON TRUE LEFT JOIN LATERAL(SELECT COUNT(*) devices,(ARRAY_AGG(device_name||' • '||browser||' • '||office ORDER BY last_seen DESC))[1] latest_device,JSON_AGG(JSON_BUILD_OBJECT('device',device_name,'browser',browser,'office',office,'ip',ip_address,'lastSeen',TO_CHAR(last_seen,'YYYY-MM-DD HH24:MI')) ORDER BY last_seen DESC) device_list FROM user_device_sessions s WHERE s.user_id=u.id)d ON TRUE ORDER BY CASE WHEN p.status IN ('PENDING','SUBMITTED')THEN 0 WHEN u.status='PENDING'THEN 1 ELSE 2 END,u.created_at DESC`);
  return NextResponse.json(result.rows,{headers:{"Cache-Control":"no-store"}})
}

export async function PATCH(req:Request){
  const a=await admin();if(!a||(a.role!=="Super Admin"&&!a.permissions.includes("*")))return NextResponse.json({error:"Super Admin access is required."},{status:403});
  try{
    const input=schema.parse(await req.json());await ensureSystemUsers();
    if(input.action==="RESET_DEVICES"){await userDb.query(`DELETE FROM user_device_sessions WHERE user_id=$1`,[input.id]);return NextResponse.json({ok:true,message:"Registered device cleared. The next login will register the replacement device."})}
    if(input.action==="FINALIZE_PASSWORD"){
      if(!input.requestId)return NextResponse.json({error:"No submitted password was selected."},{status:400});
      const client=await userDb.connect();try{await client.query("BEGIN");const request=await client.query(`SELECT proposed_password_hash FROM password_change_requests WHERE id=$1 AND user_id=$2 AND status='SUBMITTED' FOR UPDATE`,[input.requestId,input.id]);if(!request.rowCount||!request.rows[0].proposed_password_hash){await client.query("ROLLBACK");return NextResponse.json({error:"No submitted password is waiting for final approval."},{status:409})}await client.query(`UPDATE system_users SET password_hash=$1,updated_at=NOW() WHERE id=$2`,[request.rows[0].proposed_password_hash,input.id]);await client.query(`UPDATE password_change_requests SET status='COMPLETED',proposed_password_hash=NULL,completed_at=NOW(),reviewed_at=NOW(),reviewed_by=$1 WHERE id=$2`,[a.email,input.requestId]);await client.query("COMMIT");return NextResponse.json({ok:true,message:"New password approved and activated."})}catch(error){await client.query("ROLLBACK");throw error}finally{client.release()}
    }
    if(input.action==="APPROVE_PASSWORD"||input.action==="REJECT_PASSWORD"){
      if(!input.requestId)return NextResponse.json({error:"No pending password request was selected."},{status:400});
      const status=input.action==="APPROVE_PASSWORD"?"APPROVED":"REJECTED";
      const allowed=input.action==="APPROVE_PASSWORD"?["PENDING"]:["PENDING","APPROVED","SUBMITTED"];
      const result=await userDb.query(`UPDATE password_change_requests SET status=$1,reviewed_at=NOW(),reviewed_by=$2,proposed_password_hash=CASE WHEN $1='REJECTED' THEN NULL ELSE proposed_password_hash END WHERE id=$3 AND user_id=$4 AND status=ANY($5::text[]) RETURNING id`,[status,a.email,input.requestId,input.id,allowed]);
      if(!result.rowCount)return NextResponse.json({error:"This password request is no longer pending. The table has been refreshed."},{status:409});
      return NextResponse.json({ok:true,message:status==="APPROVED"?"Password change approved.":"Password change rejected."})
    }
    let result;
    if(input.action==="APPROVE"||input.action==="SAVE"){
      if(!input.office||!input.role)return NextResponse.json({error:"Office and role are required."},{status:400});
      result=await userDb.query(`UPDATE system_users SET approved_office=$1,role=$2,status=CASE WHEN $3='APPROVE' THEN 'ACTIVE' ELSE status END,approved_at=CASE WHEN $3='APPROVE' THEN NOW() ELSE approved_at END,approved_by=CASE WHEN $3='APPROVE' THEN $4 ELSE approved_by END,updated_at=NOW() WHERE id=$5 RETURNING id`,[input.office,input.role,input.action,a.email,input.id]);
    }else{
      const statuses:Record<string,string>={DISABLE:"DISABLED",ACTIVATE:"ACTIVE",REJECT:"REJECTED"};
      result=await userDb.query(`UPDATE system_users SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING id`,[statuses[input.action],input.id]);
    }
    if(!result.rowCount)return NextResponse.json({error:"User account was not found."},{status:404});
    return NextResponse.json({ok:true,message:"User settings saved."})
  }catch(error){console.error("User management update failed",error);return NextResponse.json({error:"The user update could not be saved."},{status:400})}
}
