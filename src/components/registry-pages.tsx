"use client";
import { useMemo, useState } from "react";
import {
  Activity,
  BadgeCheck,
  Banknote,
  CalendarClock,
  CircleAlert,
  CircleCheckBig,
  Download,
  FileOutput,
  Link2,
  Pencil,
  Plus,
  Power,
  Save,
  ShieldAlert,
  ShieldX,
  UserPlus,
  UsersRound,
} from "lucide-react";
import { useSystemData } from "@/lib/use-system-data";
import {
  Button,
  DataTable,
  Field,
  Modal,
  PageHeader,
  Status,
  SummaryMetrics,
  Toolbar,
} from "./ui";
type Row = Record<string, unknown>;
const asRows = (value: unknown[]) => value as Row[];
function useSearch<T>(data: T[], search: string) {
  return useMemo(
    () =>
      data.filter((x) =>
        JSON.stringify(x).toLowerCase().includes(search.toLowerCase()),
      ),
    [data, search],
  );
}
function Detail({ row }: { row: Row }) {
  return (
    <div className="detail-grid">
      {Object.entries(row).map(([k, v]) => (
        <div key={k}>
          <span>{k.replace(/([A-Z])/g, " $1")}</span>
          <b>{String(v)}</b>
        </div>
      ))}
    </div>
  );
}
function exportCsv(data: object[], name: string) {
  const keys = Object.keys(data[0] || {});
  const lines = [
    keys.join(","),
    ...data.map((r) =>
      keys
        .map((k) => `"${String((r as Row)[k] ?? "").replaceAll('"', '""')}"`)
        .join(","),
    ),
  ];
  const a = document.createElement("a");
  a.href = URL.createObjectURL(
    new Blob([lines.join("\n")], { type: "text/csv" }),
  );
  a.download = `${name}-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
}

export function ClientsPage() {
  const { data, loading, error } = useSystemData();
  const clients = data.clients;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const rows = useSearch(clients, search);
  return (
    <div className="page">
      <PageHeader
        title="Client registry"
        description="Centralized franchise, operator, driver, and vehicle records across all offices."
        actions={
          <>
            <Button
              variant="secondary"
              onClick={() => exportCsv(clients, "clients")}
            >
              <Download /> Export
            </Button>
          </>
        }
      />
      <SummaryMetrics
        metrics={[
          {
            label: "Total clients",
            value: String(clients.length),
            detail: "All registered operators",
            icon: UsersRound,
          },
          {
            label: "Active franchises",
            value: String(clients.filter((x) => x.status === "Active").length),
            detail: "97.1% of all records",
            icon: BadgeCheck,
            tone: "green",
          },
          {
            label: "For renewal",
            value: String(clients.filter((x) => x.status === "For renewal").length),
            detail: "Due within 30 days",
            icon: CalendarClock,
            tone: "amber",
          },
          {
            label: "Restricted",
            value: "0",
            detail: "Suspended or revoked",
            icon: ShieldX,
            tone: "red",
          },
        ]}
      />
      <section className="panel table-panel">
        {error && <div className="info-note"><ShieldAlert />{error}</div>}
        {loading && <div className="info-note">Loading shared BPLO records…</div>}
        <Toolbar search={search} setSearch={setSearch} />
        <DataTable
          rows={asRows(rows)}
          onView={setSelected}
          columns={[
            { key: "mtop", label: "MTOP Number" },
            { key: "owner", label: "Operator / Owner" },
            { key: "driver", label: "Driver" },
            { key: "plate", label: "Plate Number" },
            { key: "toda", label: "TODA" },
            { key: "route", label: "Route" },
            { key: "due", label: "Renewal Due" },
            {
              key: "status",
              label: "Status",
              render: (r) => <Status>{String(r.status)}</Status>,
            },
            { key: "violations", label: "Violations" },
          ]}
        />
        <div className="pagination">
          <span>Showing {rows.length} of {clients.length} records</span>
          <div>
            <button>‹</button>
            <button className="active">1</button>
            <button>2</button>
            <button>3</button>
            <button>›</button>
          </div>
        </div>
      </section>
      {selected && (
        <Modal
          title={String(selected.owner)}
          subtitle={`${selected.mtop} · Complete franchise profile`}
          onClose={() => setSelected(null)}
        >
          <div className="record-banner">
            <span className="record-avatar">
              {String(selected.owner)
                .split(" ")
                .map((x) => x[0])
                .slice(0, 2)}
            </span>
            <div>
              <b>{String(selected.owner)}</b>
              <p>
                {String(selected.contact)} · {String(selected.toda)}
              </p>
            </div>
            <Status>{String(selected.status)}</Status>
          </div>
          <div className="tab-row">
            <button className="active">Overview</button>
            <button>Franchise history</button>
            <button>Violations</button>
            <button>Payments</button>
            <button>Renewals</button>
          </div>
          <Detail row={selected} />
          <div className="info-note">
            <ShieldAlert /> Changes require the <b>Client Edit</b> permission
            and are recorded in the audit log.
          </div>
        </Modal>
      )}
    </div>
  );
}

export function ViolationsPage() {
  const { data, loading, error } = useSystemData();
  const violations = data.violations;
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Row | null>(null);
  const rows = useSearch(violations, search);
  return (
    <div className="page">
      <PageHeader
        title="Violations"
        description="Monitor all CTMO-issued violation records and their settlement status."
        actions={
          <><Button
            variant="secondary"
            onClick={() => exportCsv(violations, "violations")}
          >
            <Download /> Export report
          </Button></>
        }
      />
      <SummaryMetrics
        metrics={[
          {
            label: "Total violations",
            value: String(violations.length),
            detail: "Year-to-date records",
            icon: CircleAlert,
          },
          {
            label: "Unsettled",
            value: String(violations.filter((x) => x.status === "Unsettled").length),
            detail: "10.9% require payment",
            icon: ShieldAlert,
            tone: "amber",
          },
          {
            label: "Settled",
            value: String(violations.filter((x) => x.status === "Settled").length),
            detail: "89.1% settlement rate",
            icon: CircleCheckBig,
            tone: "green",
          },
          {
            label: "Amount due",
            value: `₱${violations.filter((x) => x.status === "Unsettled").reduce((sum,x)=>sum+Number(x.amountValue||0),0).toLocaleString("en-PH")}`,
            detail: "Outstanding balance",
            icon: Banknote,
            tone: "red",
          },
        ]}
      />
      <section className="panel table-panel">
        {error && <div className="info-note"><ShieldAlert />{error}</div>}
        {loading && <div className="info-note">Loading shared CTMO records…</div>}
        <Toolbar search={search} setSearch={setSearch} />
        <DataTable
          rows={asRows(rows)}
          onView={setSelected}
          columns={[
            { key: "ticket", label: "Ticket No." },
            { key: "violator", label: "Violator" },
            { key: "officer", label: "Apprehending Officer" },
            { key: "date", label: "Date" },
            { key: "plate", label: "Plate" },
            { key: "violation", label: "Violation" },
            { key: "amount", label: "Amount Due" },
            {
              key: "status",
              label: "Status",
              render: (r) => <Status>{String(r.status)}</Status>,
            },
          ]}
        />
      </section>
      {selected && (
        <Modal
          title="Violation details"
          subtitle={String(selected.ticket)}
          onClose={() => setSelected(null)}
        >
          <div className="linked-record">
            <Link2 />
            <div>
              <span>Linked franchise</span>
              <b>{String(selected.mtop)}</b>
            </div>
            <Button variant="ghost">Open client record</Button>
          </div>
          <Detail row={selected} />
          <div className="info-note">
            <ShieldAlert /> CTMO records are read-only. Editing requires CTMO
            authorization.
          </div>
        </Modal>
      )}
    </div>
  );
}

export function UsersPage() {
  const users: {name:string;username:string;email:string;office:string;role:string;status:string;login:string;created:string}[] = [];
  const [search, setSearch] = useState("");
  const [add, setAdd] = useState(false);
  const [selected, setSelected] = useState<Row | null>(null);
  const [approvalOffice, setApprovalOffice] = useState("BPLO");
  const [approvalRole, setApprovalRole] = useState("BPLO Admin");
  const [local, setLocal] = useState(users);
  const [notice, setNotice] = useState("");
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editOffice, setEditOffice] = useState("BPLO");
  const [editRole, setEditRole] = useState("BPLO Admin");
  const rows = useSearch(local, search);

  function openUser(row: Row) {
    setSelected(row);
    setEditing(false);
    setApprovalOffice("BPLO");
    setApprovalRole("BPLO Admin");
    setEditName(String(row.name));
    setEditEmail(String(row.email));
    setEditOffice(String(row.office));
    setEditRole(String(row.role));
  }

  function closeUser() {
    setSelected(null);
    setEditing(false);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setLocal([
      {
        name: String(f.get("name")),
        username: String(f.get("username")),
        email: String(f.get("email")),
        office: "Awaiting assignment",
        role: "Unassigned",
        status: "Pending approval",
        login: "Never",
        created: "Today",
      },
      ...local,
    ]);
    setAdd(false);
    setNotice("Account request submitted for Super Admin approval.");
  }

  function approveAccount() {
    if (!selected) return;
    setLocal((current) =>
      current.map((user) =>
        user.username === selected.username
          ? {
              ...user,
              office: approvalOffice,
              role: approvalRole,
              status: "Active",
            }
          : user,
      ),
    );
    setNotice(
      `${String(selected.name)} was approved as ${approvalRole} for ${approvalOffice}.`,
    );
    closeUser();
  }

  function saveUserEdits(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!selected) return;
    const pending = String(selected.status) === "Pending approval";
    const updated = {
      ...selected,
      name: editName.trim(),
      email: editEmail.trim(),
      office: pending ? String(selected.office) : editOffice,
      role: pending ? String(selected.role) : editRole,
    };
    setLocal((current) =>
      current.map((user) =>
        user.username === selected.username ? { ...user, ...updated } : user,
      ),
    );
    setSelected(updated);
    setEditing(false);
    setNotice(`${editName.trim()}'s account details were updated.`);
  }

  function toggleUserStatus() {
    if (!selected || selected.username === "superadmin") return;
    const nextStatus = selected.status === "Inactive" ? "Active" : "Inactive";
    const updated = { ...selected, status: nextStatus };
    setLocal((current) =>
      current.map((user) =>
        user.username === selected.username
          ? { ...user, status: nextStatus }
          : user,
      ),
    );
    setSelected(updated);
    setNotice(
      `${String(selected.name)}'s account was ${nextStatus === "Inactive" ? "disabled" : "reactivated"}.`,
    );
  }
  return (
    <div className="page">
      <PageHeader
        title="User management"
        description="Review account requests, approve users, and assign their functions and office access."
        actions={
          <Button onClick={() => setAdd(true)}>
            <UserPlus /> New account request
          </Button>
        }
      />
      {notice && (
        <div className="success-note">
          {notice}
          <button onClick={() => setNotice("")}>×</button>
        </div>
      )}
      <section className="panel table-panel">
        <Toolbar search={search} setSearch={setSearch} office />
        <DataTable
          rows={asRows(rows)}
          onView={openUser}
          rowClickOnly
          columns={[
            { key: "name", label: "Name" },
            { key: "username", label: "Username" },
            { key: "email", label: "Email" },
            { key: "office", label: "Office" },
            { key: "role", label: "Role" },
            {
              key: "status",
              label: "Account Status",
              render: (r) => <Status>{String(r.status)}</Status>,
            },
            { key: "login", label: "Last Login" },
            { key: "created", label: "Date Created" },
          ]}
        />
      </section>
      {selected && (
        <Modal
          title="User account"
          subtitle={`${String(selected.username)} · ${String(selected.office)}`}
          onClose={closeUser}
        >
          <div className="record-banner user-record-banner">
            <span className="record-avatar">
              {String(selected.name)
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")}
            </span>
            <div>
              <b>{String(selected.name)}</b>
              <p>
                {String(selected.email)} · {String(selected.role)}
              </p>
            </div>
            <Status>{String(selected.status)}</Status>
          </div>
          {String(selected.status) === "Pending approval" && (
            <div
              className="approval-flow"
              aria-label="Account approval progress"
            >
              <div className="complete">
                <i>1</i>
                <span>
                  <b>Account requested</b>
                  <small>User details received</small>
                </span>
              </div>
              <div className="current">
                <i>2</i>
                <span>
                  <b>Super Admin review</b>
                  <small>Awaiting approval</small>
                </span>
              </div>
              <div>
                <i>3</i>
                <span>
                  <b>Functions & access</b>
                  <small>Activate account</small>
                </span>
              </div>
            </div>
          )}
          <div className="tab-row">
            <button className="active">Account details</button>
            {String(selected.status) !== "Pending approval" && (
              <button>Login history</button>
            )}
            <button>Office access</button>
          </div>
          {editing ? (
            <form className="form-grid user-edit-form" onSubmit={saveUserEdits}>
              <Field label="Full name">
                <input
                  value={editName}
                  onChange={(event) => setEditName(event.target.value)}
                  required
                />
              </Field>
              <Field label="Email address">
                <input
                  type="email"
                  value={editEmail}
                  onChange={(event) => setEditEmail(event.target.value)}
                  required
                />
              </Field>
              {String(selected.status) !== "Pending approval" && (
                <>
                  <Field label="Office access">
                    <select
                      value={editOffice}
                      onChange={(event) => setEditOffice(event.target.value)}
                    >
                      <option>BPLO</option>
                      <option>CTMO</option>
                      <option>Finance/CTO</option>
                      <option>Super Admin</option>
                    </select>
                  </Field>
                  <Field label="System role">
                    <select
                      value={editRole}
                      onChange={(event) => setEditRole(event.target.value)}
                    >
                      <option>BPLO Admin</option>
                      <option>CTMO Admin</option>
                      <option>Finance Admin</option>
                      <option>Super Admin</option>
                    </select>
                  </Field>
                </>
              )}
              <div className="form-actions">
                <Button variant="secondary" onClick={() => setEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save /> Save changes
                </Button>
              </div>
            </form>
          ) : (
            <>
              <Detail row={selected} />
              {String(selected.status) === "Pending approval" ? (
                <div className="approval-assignment">
                  <div className="approval-assignment-head">
                    <ShieldAlert />
                    <div>
                      <b>Assign functions and access</b>
                      <p>
                        Select the office and role before approving this
                        account.
                      </p>
                    </div>
                  </div>
                  <div className="approval-fields">
                    <Field label="Office access">
                      <select
                        value={approvalOffice}
                        onChange={(event) =>
                          setApprovalOffice(event.target.value)
                        }
                      >
                        <option>BPLO</option>
                        <option>CTMO</option>
                        <option>Finance/CTO</option>
                        <option>Super Admin</option>
                      </select>
                    </Field>
                    <Field label="System role">
                      <select
                        value={approvalRole}
                        onChange={(event) =>
                          setApprovalRole(event.target.value)
                        }
                      >
                        <option>BPLO Admin</option>
                        <option>CTMO Admin</option>
                        <option>Finance Admin</option>
                        <option>Super Admin</option>
                      </select>
                    </Field>
                  </div>
                  <div className="approval-actions">
                    <Button
                      variant="secondary"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil /> Edit request
                    </Button>
                    <Button onClick={approveAccount}>Approve & activate</Button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="linked-record user-access-summary">
                    <ShieldAlert />
                    <div>
                      <span>Assigned access</span>
                      <b>
                        {String(selected.role)} · {String(selected.office)}
                      </b>
                    </div>
                  </div>
                  <div className="user-management-actions">
                    {selected.username === "superadmin" && (
                      <span className="self-protection-note">
                        The signed-in Super Admin account cannot be disabled.
                      </span>
                    )}
                    <Button
                      variant="secondary"
                      onClick={() => setEditing(true)}
                    >
                      <Pencil /> Edit account
                    </Button>
                    {selected.username !== "superadmin" && (
                      <button
                        type="button"
                        className={`button ${selected.status === "Inactive" ? "reactivate" : "danger"}`}
                        onClick={toggleUserStatus}
                      >
                        <Power />
                        {selected.status === "Inactive"
                          ? "Reactivate account"
                          : "Disable account"}
                      </button>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </Modal>
      )}
      {add && (
        <Modal
          title="New account request"
          subtitle="The account will remain inactive until approved by a Super Admin."
          onClose={() => setAdd(false)}
        >
          <form className="form-grid" onSubmit={submit}>
            <Field label="Full name">
              <input name="name" required placeholder="Juan Dela Cruz" />
            </Field>
            <Field label="Username">
              <input name="username" required placeholder="jdelacruz" />
            </Field>
            <Field label="Email address">
              <input
                name="email"
                type="email"
                required
                placeholder="name@office.gov.ph"
              />
            </Field>
            <div className="account-request-note">
              <ShieldAlert />
              <span>
                <b>Approval required</b>
                <small>
                  A Super Admin will assign the office, role, functions, and
                  access after reviewing this request.
                </small>
              </span>
            </div>
            <div className="form-actions">
              <Button variant="secondary" onClick={() => setAdd(false)}>
                Cancel
              </Button>
              <Button type="submit">
                <Plus /> Submit request
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

export function AuditPage() {
  const { data } = useSystemData();
  const audits = data.audits;
  const [search, setSearch] = useState("");
  const rows = useSearch(audits, search);
  return (
    <div className="page">
      <PageHeader
        title="Audit logs"
        description="Immutable record of security events and important system actions."
        actions={
          <Button
            variant="secondary"
            onClick={() => exportCsv(audits, "audit-log")}
          >
            <Download /> Export log
          </Button>
        }
      />
      <SummaryMetrics
        metrics={[
          {
            label: "Total events",
            value: "8,491",
            detail: "Recorded this year",
            icon: Activity,
          },
          {
            label: "Events today",
            value: "126",
            detail: "Across all offices",
            icon: CalendarClock,
            tone: "teal",
          },
          {
            label: "Security events",
            value: "42",
            detail: "Login and access actions",
            icon: ShieldAlert,
            tone: "amber",
          },
          {
            label: "Exports",
            value: "18",
            detail: "Reports generated today",
            icon: FileOutput,
            tone: "violet",
          },
        ]}
      />
      <div className="audit-banner">
        <ShieldAlert />
        <div>
          <b>Protected audit trail</b>
          <p>Audit records cannot be edited or deleted by application users.</p>
        </div>
      </div>
      <section className="panel table-panel">
        <Toolbar search={search} setSearch={setSearch} />
        <DataTable
          rows={asRows(rows)}
          columns={[
            { key: "time", label: "Date & Time" },
            { key: "user", label: "User" },
            { key: "office", label: "Office" },
            { key: "role", label: "Role" },
            {
              key: "action",
              label: "Action",
              render: (r) => <Status>{String(r.action)}</Status>,
            },
            { key: "module", label: "Module" },
            { key: "record", label: "Record ID" },
            { key: "description", label: "Description" },
            { key: "ip", label: "IP Address" },
          ]}
        />
      </section>
    </div>
  );
}
