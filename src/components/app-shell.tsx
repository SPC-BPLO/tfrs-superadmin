"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import {
  Bell,
  Building2,
  ChevronDown,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  X,
} from "lucide-react";

const nav = [
  ["/dashboard", "Dashboard"],
  ["/clients", "Clients"],
  ["/violations", "Violations"],
  ["/transactions", "Transactions"],
  ["/reports", "Reports"],
  ["/settings", "Settings"],
];

export default function AppShell({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const [mobile, setMobile] = useState(false);
  const [profile, setProfile] = useState(false);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link href="/dashboard" className="brand">
          <span className="seal">
            <Building2 size={23} />
          </span>
          <span>
            <b>TFRS</b>
            <small>Super Admin</small>
          </span>
        </Link>

        <nav className={mobile ? "open" : ""}>
          {nav.map(([href, label]) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobile(false)}
              className={
                path === href || path.startsWith(`${href}/`) ? "active" : ""
              }
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="nav-right">
          <button
            className="icon-button notification"
            aria-label="Notifications"
          >
            <Bell size={19} />
            <i />
          </button>
          <button
            className="profile-trigger"
            onClick={() => setProfile(!profile)}
          >
            <span className="avatar">MS</span>
            <span className="profile-copy">
              <b>Maria Santos</b>
              <small>System Administrator</small>
            </span>
            <ChevronDown size={15} />
          </button>
          <button
            className="mobile-menu"
            onClick={() => setMobile(!mobile)}
            aria-label="Toggle navigation"
          >
            {mobile ? <X /> : <Menu />}
          </button>
          {profile && (
            <div className="profile-menu">
              <div>
                <UserRound size={17} />
                <span>
                  <b>Maria Santos</b>
                  <small>Super Admin · All offices</small>
                </span>
              </div>
              <div>
                <ShieldCheck size={17} />
                <span>
                  <b>Highest access</b>
                  <small>18 permissions enabled</small>
                </span>
              </div>
              <button onClick={logout}>
                <LogOut size={17} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      <main>{children}</main>
    </div>
  );
}
