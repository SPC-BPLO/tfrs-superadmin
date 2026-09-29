"use client";
import { useState } from "react";
import {
  Archive,
  BadgeCheck,
  Banknote,
  CalendarDays,
  ChevronDown,
  CircleAlert,
  CircleDollarSign,
  Clock3,
  Download,
  FileBarChart,
  FileCheck2,
  FileText,
  Printer,
  RefreshCcw,
  Repeat2,
  SlidersHorizontal,
  WalletCards,
} from "lucide-react";
import { useSystemData } from "@/lib/use-system-data";
import {
  Button,
  DataTable,
  Modal,
  PageHeader,
  Status,
  SummaryMetrics,
  Toolbar,
} from "./ui";
type Row = Record<string, unknown>;
const asRows = (v: unknown[]) => v as Row[];
const tabs = [
  ["renewals", "Renewals", RefreshCcw],
  ["transfers", "Transfers", Repeat2],
  ["payments", "Payments", WalletCards],
  ["archives", "Archived records", Archive],
];
export function TransactionsPage() {
  const { data, loading, error } = useSystemData();
  const { archived, payments, renewals, transfers } = data;
  const [tab, setTab] = useState("renewals");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const source =
    tab === "renewals"
      ? renewals
      : tab === "transfers"
        ? transfers
        : tab === "payments"
          ? payments
          : archived;
  const rows = source.filter((x) =>
    JSON.stringify(x).toLowerCase().includes(search.toLowerCase()),
  );
  const renewedCount = renewals.filter((x) => x.status === "Renewed").length;
  const pendingRenewals = renewals.length - renewedCount;
  const paidTotal = payments.reduce(
    (sum, row) =>
      sum + Number(String(row.paid || "0").replace(/[^0-9.-]/g, "")),
    0,
  );
  const today = new Intl.DateTimeFormat("en-PH", { dateStyle: "medium" }).format(
    new Date(),
  );
  const todayPayments = payments.filter((row) => row.date === today);
  const todayTotal = todayPayments.reduce(
    (sum, row) =>
      sum + Number(String(row.paid || "0").replace(/[^0-9.-]/g, "")),
    0,
  );
  const cols: Record<
    string,
    { key: string; label: string; render?: (r: Row) => React.ReactNode }[]
  > = {
    renewals: [
      { key: "mtop", label: "MTOP" },
      { key: "client", label: "Client" },
      { key: "toda", label: "TODA" },
      { key: "driver", label: "Driver" },
      { key: "plate", label: "Plate Number" },
      { key: "expiry", label: "Current Expiry" },
      {
        key: "status",
        label: "Renewal Status",
        render: (r) => <Status>{String(r.status)}</Status>,
      },
      { key: "date", label: "Date Processed" },
    ],
    transfers: [
      { key: "mtop", label: "MTOP" },
      { key: "previous", label: "Previous Owner" },
      { key: "newOwner", label: "New Owner" },
      { key: "change", label: "Change Type" },
      { key: "date", label: "Date Processed" },
      { key: "reference", label: "Reference Number" },
      {
        key: "status",
        label: "Status",
        render: (r) => <Status>{String(r.status)}</Status>,
      },
    ],
    payments: [
      { key: "ticket", label: "Ticket Number" },
      { key: "payor", label: "Payor" },
      { key: "violation", label: "Violation" },
      { key: "due", label: "Amount Due" },
      { key: "paid", label: "Amount Paid" },
      { key: "or", label: "OR Number" },
      {
        key: "status",
        label: "Payment Status",
        render: (r) => <Status>{String(r.status)}</Status>,
      },
      { key: "date", label: "Date Paid" },
    ],
    archives: [
      { key: "mtop", label: "MTOP" },
      { key: "owner", label: "Previous Owner" },
      { key: "driver", label: "Driver" },
      { key: "vehicle", label: "Vehicle" },
      { key: "plate", label: "Plate" },
      { key: "toda", label: "TODA" },
      { key: "type", label: "Transaction Type" },
      { key: "date", label: "Date Processed" },
      { key: "reference", label: "Reference" },
    ],
  };
  const summaries = {
    renewals: [
      {
        label: "Renewals this year",
        value: String(renewals.length),
        detail: "All processed requests",
        icon: RefreshCcw,
      },
      {
        label: "Pending review",
        value: String(pendingRenewals),
        detail: "Awaiting Finance verification",
        icon: Clock3,
        tone: "amber" as const,
      },
      {
        label: "Approved",
        value: String(renewedCount),
        detail: renewals.length
          ? `${Math.round((renewedCount / renewals.length) * 100)}% approval rate`
          : "0% approval rate",
        icon: BadgeCheck,
        tone: "green" as const,
      },
      {
        label: "Due soon",
        value: String(pendingRenewals),
        detail: "Currently due for processing",
        icon: CalendarDays,
        tone: "red" as const,
      },
    ],
    transfers: [
      {
        label: "Total transfers",
        value: String(transfers.length),
        detail: "Available shared records",
        icon: Repeat2,
      },
      {
        label: "Completed",
        value: String(transfers.filter((x) => x.status === "Completed").length),
        detail: "Completed transfers",
        icon: BadgeCheck,
        tone: "green" as const,
      },
      {
        label: "Under review",
        value: String(transfers.filter((x) => x.status !== "Completed").length),
        detail: "Awaiting validation",
        icon: Clock3,
        tone: "amber" as const,
      },
      {
        label: "Archived records",
        value: String(archived.length),
        detail: "Previous records secured",
        icon: Archive,
        tone: "violet" as const,
      },
    ],
    payments: [
      {
        label: "Total collections",
        value: `₱${paidTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        detail: "Year-to-date revenue",
        icon: CircleDollarSign,
        tone: "teal" as const,
      },
      {
        label: "Settled payments",
        value: String(payments.length),
        detail: "Official receipts issued",
        icon: BadgeCheck,
        tone: "green" as const,
      },
      {
        label: "Pending payments",
        value: "0",
        detail: "Settled records are shown here",
        icon: CircleAlert,
        tone: "amber" as const,
      },
      {
        label: "Collected today",
        value: `₱${todayTotal.toLocaleString("en-PH", { minimumFractionDigits: 2 })}`,
        detail: `${todayPayments.length} transactions`,
        icon: Banknote,
      },
    ],
    archives: [
      {
        label: "Archived records",
        value: String(archived.length),
        detail: "Permanent history",
        icon: Archive,
        tone: "violet" as const,
      },
      {
        label: "Transfer archives",
        value: String(archived.filter((x) => x.type === "Transfer").length),
        detail: "Ownership changes",
        icon: Repeat2,
      },
      {
        label: "Renewal archives",
        value: String(archived.filter((x) => x.type === "Renewal").length),
        detail: "Previous franchise terms",
        icon: RefreshCcw,
        tone: "green" as const,
      },
      {
        label: "Added this month",
        value: "0",
        detail: "No default archive records",
        icon: CalendarDays,
        tone: "teal" as const,
      },
    ],
  };
  return (
    <div className="page">
      <PageHeader
        title="Transactions"
        description="Review renewals, ownership transfers, payments, and historical records."
      />
      {error && <div className="info-note"><CircleAlert/>{error}</div>}
      {loading && <div className="info-note">Loading shared Finance and BPLO records…</div>}
      <SummaryMetrics metrics={summaries[tab as keyof typeof summaries]} />
      <div className="module-tabs">
        {tabs.map(([id, label, Icon]) => (
          <button
            key={String(id)}
            className={tab === id ? "active" : ""}
            onClick={() => {
              setTab(String(id));
              setSearch("");
            }}
          >
            <Icon />
            {String(label)}
            <span>
              {id === "renewals"
                ? renewals.length
                : id === "transfers"
                  ? transfers.length
                  : id === "payments"
                    ? payments.length
                    : id === "archives"
                      ? archived.length
                      : ""}
            </span>
          </button>
        ))}
      </div>
      <section className="panel table-panel">
        <Toolbar search={search} setSearch={setSearch} />
        <DataTable
          rows={asRows(rows)}
          columns={cols[tab]}
          onView={setSelected}
        />
      </section>
      {selected && (
        <Modal
          title={`${String(tab).slice(0, -1)} record`}
          subtitle={String(
            selected.reference || selected.ticket || selected.mtop,
          )}
          onClose={() => setSelected(null)}
          printable={tab === "archives" || tab === "transfers"}
        >
          <div className="document-preview">
            <div className="document-brand">
              <FileText />
              <div>
                <b>CITY GOVERNMENT</b>
                <span>Tricycle Franchising and Renewal System</span>
              </div>
            </div>
            <h3>
              {tab === "archives"
                ? "ARCHIVED FRANCHISE RECORD"
                : tab === "transfers"
                  ? "TRANSFER FORM"
                  : "TRANSACTION DETAILS"}
            </h3>
            <div className="detail-grid">
              {Object.entries(selected).map(([k, v]) => (
                <div key={k}>
                  <span>{k.replace(/([A-Z])/g, " $1")}</span>
                  <b>{String(v)}</b>
                </div>
              ))}
            </div>
            <p className="document-note">
              This electronically generated record is subject to verification in
              the TFRS audit trail.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

const reportCards = [
  [
    "Franchise Report",
    "Active, suspended, and revoked franchise records",
    FileText,
    "Live records",
  ],
  [
    "Renewal Report",
    "Renewal status and processing performance",
    RefreshCcw,
    "Live records",
  ],
  [
    "Transfer Report",
    "Ownership, vehicle, and TODA changes",
    Repeat2,
    "No records",
  ],
  [
    "Violation Report",
    "All recorded traffic violations",
    FileCheck2,
    "Live records",
  ],
  [
    "Payment Collection",
    "Collections and official receipt references",
    WalletCards,
    "Live records",
  ],
  [
    "Settled / Unsettled",
    "Violation settlement summary",
    FileBarChart,
    "Live records",
  ],
  [
    "Suspended / Revoked",
    "Restricted franchise accounts",
    Archive,
    "No records",
  ],
  [
    "User Activity",
    "Account access and module usage",
    CalendarDays,
    "No default users",
  ],
  [
    "Audit Log Report",
    "Security and transaction audit trail",
    FileCheck2,
    "Live audit events",
  ],
];
export function ReportsPage() {
  const [preview, setPreview] = useState<string | null>(null);
  return (
    <div className="page reports-page">
      <PageHeader
        title="Reports center"
        description="Generate, filter, print, and export system-wide operational reports."
        actions={
          <div className="reports-header-tools">
            <form
              className="report-filter-inline"
              onSubmit={(event) => event.preventDefault()}
            >
              <div className="report-filter-control report-date-control">
                <CalendarDays aria-hidden="true" />
                <div>
                  <span>Date range</span>
                  <div className="report-date-inputs">
                    <input
                      type="date"
                      defaultValue="2026-09-01"
                      aria-label="Date from"
                    />
                    <i>to</i>
                    <input
                      type="date"
                      defaultValue="2026-09-23"
                      aria-label="Date to"
                    />
                  </div>
                </div>
              </div>
              <label className="report-filter-control">
                <span>Office</span>
                <select aria-label="Filter reports by office">
                  <option>All offices</option>
                  <option>BPLO</option>
                  <option>CTMO</option>
                  <option>Finance/CTO</option>
                </select>
                <ChevronDown
                  className="report-select-chevron"
                  aria-hidden="true"
                />
              </label>
              <label className="report-filter-control">
                <span>Status</span>
                <select aria-label="Filter reports by status">
                  <option>All statuses</option>
                  <option>Active</option>
                  <option>Pending</option>
                  <option>Settled</option>
                </select>
                <ChevronDown
                  className="report-select-chevron"
                  aria-hidden="true"
                />
              </label>
              <button className="report-apply" type="submit">
                <SlidersHorizontal />
                <span>Apply</span>
              </button>
            </form>
            <Button variant="secondary">
              <Download /> Export
            </Button>
          </div>
        }
      />
      <div className="reports-grid">
        {reportCards.map(([title, desc, Icon, total]) => (
          <article className="report-card" key={String(title)}>
            <span className="report-icon">
              <Icon />
            </span>
            <div>
              <h3>{String(title)}</h3>
              <p>{String(desc)}</p>
              <small>{String(total)}</small>
            </div>
            <div className="report-actions">
              <button onClick={() => setPreview(String(title))}>
                <Printer /> Preview
              </button>
              <button>
                <Download /> CSV
              </button>
            </div>
          </article>
        ))}
      </div>
      {preview && (
        <Modal
          title="Print preview"
          subtitle={preview}
          onClose={() => setPreview(null)}
          printable
        >
          <div className="document-preview report-document">
            <div className="document-brand">
              <FileText />
              <div>
                <b>CITY GOVERNMENT</b>
                <span>Tricycle Franchising and Renewal System</span>
              </div>
            </div>
            <h3>{preview.toUpperCase()}</h3>
            <p>Reporting period: September 1–23, 2026 · All offices</p>
            <table>
              <thead>
                <tr>
                  <th>Reference</th>
                  <th>Description</th>
                  <th>Office</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody><tr><td colSpan={5}>Use Export on the live registry page for current database records.</td></tr></tbody>
            </table>
            <p className="document-note">
              Generated by Maria Santos · Super Admin · Sep 23, 2026 10:15 AM
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}
