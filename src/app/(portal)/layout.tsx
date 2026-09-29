import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import AppShell from "@/components/app-shell";
import { verifySession } from "@/lib/auth";

export default async function PortalLayout({children}:{children:React.ReactNode}){
 const token=(await cookies()).get('tfrs_session')?.value;
 if(!(await verifySession(token))) redirect('/login');
 return <AppShell>{children}</AppShell>;
}
