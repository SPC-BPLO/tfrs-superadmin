import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { verifySession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
async function authorized(){ return verifySession((await cookies()).get("tfrs_session")?.value); }
export async function GET(){
 const user=await authorized(); if(!user) return NextResponse.json({error:"Unauthorized"},{status:401});
 const data=await prisma.client.findMany({include:{franchises:{include:{toda:true,owners:{where:{active:true}},drivers:{where:{active:true}},vehicles:{where:{active:true}},_count:{select:{violations:true}}}}},orderBy:{updatedAt:'desc'}}); return NextResponse.json({data});
}
const input=z.object({firstName:z.string().trim().min(2).max(60),lastName:z.string().trim().min(2).max(60),address:z.string().trim().min(5).max(250),contact:z.string().regex(/^[0-9 +()-]{7,20}$/),email:z.string().email().optional()});
export async function POST(request:Request){
 const user=await authorized(); if(!user||(!user.permissions.includes('*')&&!user.permissions.includes('client.create'))) return NextResponse.json({error:"Forbidden"},{status:403});
 try{const body=input.parse(await request.json());const client=await prisma.client.create({data:body});await prisma.auditLog.create({data:{roleName:user.role,action:'ADD',module:'Clients',recordId:client.id,description:`Created client ${client.firstName} ${client.lastName}`}});return NextResponse.json({data:client},{status:201})}catch{return NextResponse.json({error:"Invalid client details"},{status:400})}
}
