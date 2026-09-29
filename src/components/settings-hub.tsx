"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  ClipboardList,
  WalletCards,
  Settings2,
  UsersRound,
} from "lucide-react";
import { SettingsPage } from "@/components/admin-pages";
import { AuditPage } from "@/components/registry-pages";
import UserManagement from "@/components/user-management";
import ViolationPricing from "@/components/violation-pricing";

const tabs = [
  {
    id: "pricing",
    label: "Violation Pricing",
    description: "CTMO penalty amounts",
    icon: WalletCards,
  },
  {
    id: "system",
    label: "System Settings",
    description: "Rules, offices and documents",
    icon: Settings2,
  },
  {
    id: "users",
    label: "Users & Permissions",
    description: "Office roles and password requests",
    icon: UsersRound,
  },
  {
    id: "audit",
    label: "Audit Logs",
    description: "Security and activity history",
    icon: ClipboardList,
  },
];

export default function SettingsHub() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const requested = params.get("tab") || "system";
  const active = tabs.some((tab) => tab.id === requested)
    ? requested
    : "system";

  function selectTab(tab: string) {
    router.replace(tab === "system" ? pathname : `${pathname}?tab=${tab}`, {
      scroll: false,
    });
  }

  return (
    <div className="settings-hub">
      <div className="settings-hub-bar" aria-label="Settings sections">
        <div className="settings-hub-tabs" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active === tab.id}
              className={active === tab.id ? "active" : ""}
              onClick={() => selectTab(tab.id)}
            >
              <tab.icon />
              <span>
                <b>{tab.label}</b>
                <small>{tab.description}</small>
              </span>
            </button>
          ))}
        </div>
      </div>
      <div
        key={active}
        className="settings-hub-content settings-tab-transition"
        role="tabpanel"
      >
        {active === "system" && <SettingsPage />}
        {active === "pricing" && <ViolationPricing />}
        {active === "users" && <UserManagement/>}
        {active === "audit" && <AuditPage />}
      </div>
    </div>
  );
}
