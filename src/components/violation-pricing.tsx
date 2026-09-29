"use client";

import { useEffect, useState } from "react";
import { Save, TriangleAlert } from "lucide-react";
import { Button, PageHeader } from "./ui";

type Price = { name: string; amount: number | string; displayOrder: number; active: boolean };

export default function ViolationPricing() {
  const [prices, setPrices] = useState<Price[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/violation-prices", { cache: "no-store" })
      .then(async response => { const data = await response.json(); if (!response.ok) throw new Error(data.error); setPrices(data); })
      .catch(reason => setError(reason.message || "Unable to load violation pricing."))
      .finally(() => setLoading(false));
  }, []);

  async function save() {
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch("/api/violation-prices", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prices }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setPrices(data); setMessage("Violation pricing updated successfully.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Unable to save violation pricing."); }
    finally { setSaving(false); }
  }

  return <div className="page"><PageHeader title="Violation pricing" description="Manage the official CTMO penalty assigned to each violation." />
    {message && <div className="success-note">{message}<button onClick={() => setMessage("")}>×</button></div>}
    {error && <div className="pricing-error"><TriangleAlert />{error}</div>}
    <section className="panel superadmin-pricing"><div className="panel-title"><div><h2>Penalty schedule</h2><p>Changes apply to new and edited tickets. Existing settled receipts remain unchanged.</p></div><span>{prices.length} violations</span></div>
      {loading ? <p className="pricing-loading">Loading current database prices…</p> : <div className="pricing-table">{prices.map((item, index) => <label key={item.name}><span><b>{item.name}</b><small>Official penalty amount</small></span><div><i>₱</i><input aria-label={`${item.name} penalty`} type="number" min="0" step="1" value={item.amount} onChange={event => setPrices(current => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, amount: event.target.value } : entry))} /></div></label>)}</div>}
      <div className="pricing-actions"><small>Every change is recorded in the audit log.</small><Button onClick={save} disabled={saving || loading || !prices.length}><Save />{saving ? "Saving…" : "Save all prices"}</Button></div>
    </section>
  </div>;
}
