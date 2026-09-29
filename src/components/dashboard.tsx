"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BadgeCheck,
  Banknote,
  Building2,
  CircleDollarSign,
  Clock3,
  FileCheck2,
  RefreshCcw,
  Share2,
  ShieldAlert,
  Waypoints,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { PageHeader, Status } from "./ui";
import { useSystemData } from "@/lib/use-system-data";
const colors = ["#2874e8", "#60a5fa", "#93c5fd", "#f59e0b", "#ef4444", "#14b8a6"];

function CurrentDateTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const updateTime = () => setNow(new Date());
    updateTime();
    const timer = window.setInterval(updateTime, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  return (
    <time className="dashboard-datetime" dateTime={now?.toISOString()}>
      {now
        ? new Intl.DateTimeFormat("en-PH", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          }).format(now)
        : "Loading date and time…"}
    </time>
  );
}

export default function Dashboard() {
  const router = useRouter();
  const { data, loading, error, refresh } = useSystemData();
  const [shared, setShared] = useState<Set<string>>(new Set());
  const [sharing, setSharing] = useState("");
  useEffect(() => {
    fetch("/api/mayor-publications", { cache: "no-store" })
      .then((response) => response.json())
      .then((body) => setShared(new Set((body.data || []).map((row: {metric_key:string}) => row.metric_key))))
      .catch(() => undefined);
  }, []);
  const unsettled = data.violations.filter((x) => x.status === "Unsettled");
  const settled = data.violations.filter((x) => x.status === "Settled");
  const collected = settled.reduce((sum,x)=>sum+Number(x.amountValue||0),0);
  const pendingRenewals = data.renewals.filter(x=>x.status!=="Renewed");
  const approvedRenewals = data.renewals.filter(x=>x.status==="Renewed");
  const dueAmount = unsettled.reduce((s,x)=>s+Number(x.amountValue||0),0);
  const stats = [
    {key:"registered-franchises",label:"Registered franchises",value:String(data.clients.length),change:"BPLO registry",source:"BPLO",icon:BadgeCheck,color:"blue",href:"/clients"},
    {key:"pending-renewals",label:"Pending renewals",value:String(pendingRenewals.length),change:"Awaiting verification",source:"BPLO",icon:Clock3,color:"amber",href:"/transactions"},
    {key:"approved-renewals",label:"Approved renewals",value:String(approvedRenewals.length),change:"Verified by Finance",source:"BPLO / Finance",icon:RefreshCcw,color:"cyan",href:"/transactions"},
    {key:"archived-records",label:"Archived records",value:String(data.archived.length),change:"Franchise history",source:"BPLO",icon:ShieldAlert,color:"red",href:"/transactions"},
    {key:"total-violations",label:"Total violations",value:String(data.violations.length),change:"CTMO records",source:"CTMO",icon:AlertTriangle,color:"violet",href:"/violations"},
    {key:"unsettled-violations",label:"Unsettled violations",value:String(unsettled.length),change:`₱${dueAmount.toLocaleString("en-PH")} due`,source:"CTMO / Finance",icon:Clock3,color:"orange",href:"/violations"},
    {key:"settled-violations",label:"Settled violations",value:String(settled.length),change:data.violations.length?`${Math.round(settled.length/data.violations.length*100)}% rate`:`0% rate`,source:"Finance",icon:FileCheck2,color:"green",href:"/violations"},
    {key:"total-collections",label:"Total collections",value:`₱${collected.toLocaleString("en-PH",{minimumFractionDigits:2})}`,change:"Finance settlements",source:"Finance",icon:CircleDollarSign,color:"teal",href:"/transactions"},
  ];
  async function toggleMayor(stat: (typeof stats)[number]) {
    setSharing(stat.key);
    const isShared = shared.has(stat.key);
    const response = await fetch(`/api/mayor-publications${isShared ? `?metricKey=${encodeURIComponent(stat.key)}` : ""}`, {
      method: isShared ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: isShared ? undefined : JSON.stringify({metricKey:stat.key,label:stat.label,value:stat.value,detail:stat.change,source:stat.source}),
    });
    if (response.ok) setShared((current)=>{const next=new Set(current);if(isShared)next.delete(stat.key);else next.add(stat.key);return next});
    setSharing("");
  }
  const months = useMemo(() => Array.from({length:6},(_,i)=>{const d=new Date();d.setDate(1);d.setMonth(d.getMonth()-(5-i));return {key:`${d.getFullYear()}-${d.getMonth()}`,m:d.toLocaleString("en-PH",{month:"short"}),renewed:0,pending:0,collections:0}}),[]);
  const renewal = months.map((month)=>{let renewed=0;let pending=0;for(const row of data.renewals){const raw=row.renewalDate||row.createdAt;if(!raw)continue;const d=new Date(String(raw));if(`${d.getFullYear()}-${d.getMonth()}`===month.key){if(row.status==="Renewed")renewed++;else pending++}}return {m:month.m,renewed,pending}});
  const collections = months.map((month)=>{let value=0;for(const row of data.violations){if(row.status!=="Settled"||!row.createdAt)continue;const d=new Date(String(row.createdAt));if(`${d.getFullYear()}-${d.getMonth()}`===month.key)value+=Number(row.amountValue||0)}return {m:month.m,v:value}});
  const violationCounts = new Map<string,number>();
  data.violations.forEach((row)=>{const label=String(row.violation||"Unspecified");violationCounts.set(label,(violationCounts.get(label)||0)+1)});
  const vio = [...violationCounts.entries()].sort((a,b)=>b[1]-a[1]).slice(0,6).map(([name,value],i)=>({name,value,color:colors[i%colors.length]}));
  const activity = data.audits.slice(0,6);
  return (
    <div className="page dashboard">
      <PageHeader
        title="Super Admin Dashboard"
        description="Live information from BPLO, CTMO, and Finance."
        actions={<><button className="button secondary" onClick={refresh}><RefreshCcw/> Refresh</button><CurrentDateTime /></>}
      />
      {error && <div className="info-note"><AlertTriangle/>{error}</div>}
      {loading && <div className="info-note">Loading BPLO, CTMO, and Finance data…</div>}
      <div className="stat-grid">
        {stats.map((s) => (
          <div className="stat-card" key={s.label} role="link" tabIndex={0} onClick={()=>router.push(s.href)} onKeyDown={(event)=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();router.push(s.href)}}} aria-label={`Open ${s.label}`}>
            <div className={`stat-icon ${s.color}`}>
              <s.icon />
            </div>
            <div className="stat-top">
              <span>{s.label}</span>
              <b>{s.value}</b>
            </div>
            <small>
              <ArrowRight />
              {s.change}
            </small>
            <div className="dashboard-card-actions">
              <button onClick={(event)=>{event.stopPropagation();void toggleMayor(s)}} disabled={sharing===s.key} aria-label={shared.has(s.key)?`Remove ${s.label} from Mayor dashboard`:`Share ${s.label} with Mayor`} title={shared.has(s.key)?"Remove from Mayor":"Share with Mayor"}>
                <Share2 />
              </button>
            </div>
          </div>
        ))}
      </div>
      <div className="dash-grid">
        <section className="panel wide">
          <PanelTitle
            title="Franchise renewals"
            sub="Monthly processing volume"
            badge="Last 6 months"
          />
          <div className="chart-lg">
            <ResponsiveContainer>
              <AreaChart data={renewal}>
                <defs>
                  <linearGradient id="renewed" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2874e8" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2874e8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="#e9eff7" vertical={false} />
                <XAxis dataKey="m" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="renewed"
                  stroke="#2874e8"
                  strokeWidth={3}
                  fill="url(#renewed)"
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  fill="transparent"
                  strokeDasharray="5 5"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div className="legend">
            <span>
              <i className="renewed" /> Renewed
            </span>
            <span>
              <i className="pending" /> Pending
            </span>
          </div>
        </section>
        <section className="panel">
          <PanelTitle
            title="Violations by type"
            sub="Year-to-date distribution"
          />
          <div className="pie-layout">
            <div className="pie">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={vio}
                    dataKey="value"
                    innerRadius={58}
                    outerRadius={80}
                    paddingAngle={2}
                  >
                    {vio.map((v) => (
                      <Cell key={v.name} fill={v.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <span>
                <b>{data.violations.length}</b>
                <small>Total</small>
              </span>
            </div>
            <div className="pie-legend">
              {vio.map((v) => (
                <div key={v.name}>
                  <span>
                    <i style={{ background: v.color }} />
                    {v.name}
                  </span>
                  <b>{v.value}</b>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="panel">
          <PanelTitle
            title="Payment collections"
            sub="Collections in thousands"
            badge={`₱${collected.toLocaleString("en-PH",{minimumFractionDigits:2})} total`}
          />
          <div className="chart-md">
            <ResponsiveContainer>
              <BarChart data={collections}>
                <CartesianGrid stroke="#eef2f7" vertical={false} />
                <XAxis dataKey="m" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip />
                <Bar dataKey="v" fill="#2874e8" radius={[6, 6, 2, 2]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>
        <section className="panel wide recent">
          <PanelTitle
            title="Recent system activity"
            sub="Latest events across connected offices"
            action="View audit log"
            onAction={()=>router.push("/settings?tab=audit")}
          />
          <div>
            {activity.length===0&&<div className="info-note">No system activity has been recorded.</div>}
            {activity.map((a, i) => (
              <div className="activity-item" key={`${String(a.record)}-${i}`}>
                <span className={`activity-dot a${i}`}>
                  <Activity />
                </span>
                <div>
                  <b>{String(a.action)}</b>
                  <small>{String(a.description)}</small>
                </div>
                <Status>{String(a.office)}</Status>
                <time>{String(a.time)}</time>
              </div>
            ))}
          </div>
        </section>
      </div>
      <section className="offices">
        <div className="section-heading">
          <div>
            <h2>Office activity</h2>
            <p>Live connection and workload summary</p>
          </div>
          <button onClick={()=>router.push("/reports")}>
            View system details <ArrowRight />
          </button>
        </div>
        <div className="office-grid">
          <Office
            name="BPLO"
            full="Licensing & Franchising"
            icon={<Building2 />}
            stats={[
              [String(data.clients.length), "Franchises"],
              [String(pendingRenewals.length), "Pending"],
              [String(approvedRenewals.length), "Renewed"],
            ]}
            onOpen={()=>router.push("/clients")}
            online={!error}
          />
          <Office
            name="CTMO"
            full="Traffic Management"
            icon={<Waypoints />}
            stats={[
              [String(data.violations.length), "Violations"],
              [String(unsettled.length), "Unsettled"],
              [String(settled.length), "Settled"],
            ]}
            onOpen={()=>router.push("/violations")}
            online={!error}
          />
          <Office
            name="Finance / CTO"
            full="Payments & Collections"
            icon={<Banknote />}
            stats={[
              [`₱${collected.toLocaleString("en-PH")}`, "Collected"],
              [String(unsettled.length), "Pending"],
              [String(settled.length), "Settled"],
            ]}
            onOpen={()=>router.push("/transactions")}
            online={!error}
          />
        </div>
      </section>
    </div>
  );
}
function PanelTitle({
  title,
  sub,
  badge,
  action,
  onAction,
}: {
  title: string;
  sub: string;
  badge?: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="panel-title">
      <div>
        <h2>{title}</h2>
        <p>{sub}</p>
      </div>
      {badge && <span>{badge}</span>}
      {action && (
        <button onClick={onAction}>
          {action}
          <ArrowRight />
        </button>
      )}
    </div>
  );
}
function Office({
  name,
  full,
  icon,
  stats,
  onOpen,
  online,
}: {
  name: string;
  full: string;
  icon: React.ReactNode;
  stats: string[][];
  onOpen: () => void;
  online: boolean;
}) {
  return (
    <article className="office-card">
      <div className="office-head">
        <span>{icon}</span>
        <div>
          <h3>{name}</h3>
          <p>{full}</p>
        </div>
        <small>
          <i /> {online ? "Connected" : "Unavailable"}
        </small>
      </div>
      <div className="office-stats">
        {stats.map((s) => (
          <div key={s[1]}>
            <b>{s[0]}</b>
            <span>{s[1]}</span>
          </div>
        ))}
      </div>
      <div className="office-foot">
        <span>{online ? "Live database connection" : "Connection unavailable"}</span>
        <button onClick={onOpen}>
          Open summary <ArrowRight />
        </button>
      </div>
    </article>
  );
}
