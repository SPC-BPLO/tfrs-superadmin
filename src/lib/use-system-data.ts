"use client";
import { useCallback, useEffect, useState } from "react";
export type SystemData = { clients:Record<string,unknown>[]; violations:Record<string,unknown>[]; renewals:Record<string,unknown>[]; payments:Record<string,unknown>[]; audits:Record<string,unknown>[]; transfers:Record<string,unknown>[]; archived:Record<string,unknown>[]; franchiseTransactions:Record<string,unknown>[] };
const empty:SystemData={clients:[],violations:[],renewals:[],payments:[],audits:[],transfers:[],archived:[],franchiseTransactions:[]};
export function useSystemData() {
  const [data, setData] = useState<SystemData>(empty);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/system-data", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error || "Unable to load data");
      setData(body);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to load data");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void refresh();
    const timer = window.setInterval(() => void refresh(), 10000);
    return () => window.clearInterval(timer);
  }, [refresh]);
  return { data, loading, error, refresh };
}
