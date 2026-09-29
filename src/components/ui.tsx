"use client";
import { ReactNode } from "react";
import {
  type LucideIcon,
  ChevronDown,
  Download,
  Filter,
  Plus,
  Printer,
  Search,
  X,
} from "lucide-react";

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="page-head">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {actions && <div className="head-actions">{actions}</div>}
    </div>
  );
}
export function Button({
  children,
  variant = "primary",
  onClick,
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button type={type} onClick={onClick} disabled={disabled} className={`button ${variant}`}>
      {children}
    </button>
  );
}
export function Status({ children }: { children: ReactNode }) {
  const s = String(children).toLowerCase().replaceAll(" ", "-");
  return <span className={`status ${s}`}>{children}</span>;
}

export type SummaryMetric = {
  label: string;
  value: string;
  detail?: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "amber" | "red" | "violet" | "teal";
};

export function SummaryMetrics({ metrics }: { metrics: SummaryMetric[] }) {
  return (
    <section className="summary-metrics" aria-label="Module summary">
      {metrics.map((metric) => (
        <article
          className={`summary-metric ${metric.tone || "blue"}`}
          key={metric.label}
        >
          <div className="summary-metric-copy">
            <span>{metric.label}</span>
            <b>{metric.value}</b>
            {metric.detail && <small>{metric.detail}</small>}
          </div>
        </article>
      ))}
    </section>
  );
}
export function Toolbar({
  search,
  setSearch,
  office = true,
  status = true,
  onExport,
}: {
  search: string;
  setSearch: (v: string) => void;
  office?: boolean;
  status?: boolean;
  onExport?: () => void;
}) {
  return (
    <div className="toolbar">
      <label className="search">
        <Search size={17} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search records..."
        />
      </label>
      <div className="toolbar-actions">
        {office && (
          <button className="filter">
            <span>All offices</span>
            <ChevronDown size={15} />
          </button>
        )}
        {status && (
          <button className="filter">
            <Filter size={15} />
            <span>All statuses</span>
          </button>
        )}
        {onExport && (
          <button className="filter" onClick={onExport}>
            <Download size={15} />
            <span>Export</span>
          </button>
        )}
      </div>
    </div>
  );
}
export function DataTable({
  columns,
  rows,
  onView,
  rowClickOnly = false,
}: {
  columns: {
    key: string;
    label: string;
    render?: (row: Record<string, unknown>) => ReactNode;
  }[];
  rows: Record<string, unknown>[];
  onView?: (row: Record<string, unknown>) => void;
  rowClickOnly?: boolean;
}) {
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c.key}>{c.label}</th>
            ))}
            {onView && !rowClickOnly && <th></th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={i}
              className={rowClickOnly ? "data-row-clickable" : undefined}
              onClick={rowClickOnly && onView ? () => onView(row) : undefined}
              onKeyDown={
                rowClickOnly && onView
                  ? (event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        onView(row);
                      }
                    }
                  : undefined
              }
              tabIndex={rowClickOnly ? 0 : undefined}
              role={rowClickOnly ? "button" : undefined}
              aria-label={
                rowClickOnly
                  ? `View ${String(row.name || "record")}`
                  : undefined
              }
            >
              {columns.map((c) => (
                <td key={c.key}>
                  {c.render ? c.render(row) : String(row[c.key] ?? "—")}
                </td>
              ))}
              {onView && !rowClickOnly && (
                <td>
                  <button className="view-link" onClick={() => onView(row)}>
                    View
                  </button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
      {!rows.length && <div className="empty">No matching records found.</div>}
    </div>
  );
}
export function Modal({
  title,
  subtitle,
  children,
  onClose,
  printable = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  onClose: () => void;
  printable?: boolean;
}) {
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div
        className={`modal ${printable ? "print-modal" : ""}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-head">
          <div>
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={19} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {printable && (
          <div className="modal-actions">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => window.print()}>
              <Printer size={16} /> Print document
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}
export function AddIcon() {
  return <Plus size={17} />;
}
