"use client";

import { useCallback, useEffect, useState } from "react";
import type { Deal, DealStage } from "@/lib/types";
import { addDeal, deleteDeal, getDeals, updateDeal } from "@/lib/store";

const STAGES: { value: DealStage; label: string; color: string }[] = [
  { value: "exploring", label: "Exploring", color: "border-slate-300" },
  { value: "negotiating", label: "Negotiating", color: "border-amber-300" },
  { value: "live", label: "Live", color: "border-green-400" },
  { value: "paused", label: "Paused", color: "border-red-300" },
];

export default function PipelineTab() {
  const [deals, setDeals] = useState<Deal[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [partner, setPartner] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setDeals(await getDeals());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      await addDeal({ name: name.trim(), partner: partner.trim() || null });
      setName("");
      setPartner("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not add");
    }
  };

  const move = async (id: string, stage: DealStage) => {
    await updateDeal(id, { stage });
    await load();
  };

  const saveNext = async (id: string, next_step: string) => {
    await updateDeal(id, { next_step });
    await load();
  };

  const remove = async (id: string) => {
    await deleteDeal(id);
    await load();
  };

  if (loading) return <p className="text-sm text-slate-500">Loading…</p>;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white p-3">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Initiative / deal (e.g. 'Robotics competition')"
          className="min-w-[200px] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <input
          value={partner}
          onChange={(e) => setPartner(e.target.value)}
          placeholder="Partner (e.g. Qualcomm)"
          className="w-44 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-ink"
        />
        <button
          onClick={add}
          className="rounded-md bg-ink px-4 py-2 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Add deal
        </button>
        {error && <span className="text-xs text-red-600">{error}</span>}
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {STAGES.map((s) => {
          const items = deals.filter((d) => d.stage === s.value);
          return (
            <div key={s.value} className="space-y-2">
              <div className="flex items-baseline justify-between">
                <h3 className="text-sm font-semibold">{s.label}</h3>
                <span className="text-xs text-slate-400">{items.length}</span>
              </div>
              {items.length === 0 && (
                <p className="rounded-md border border-dashed border-slate-200 p-3 text-xs text-slate-400">
                  Nothing here
                </p>
              )}
              {items.map((d) => (
                <div
                  key={d.id}
                  className={`rounded-lg border-l-4 ${s.color} border-y border-r border-slate-200 bg-white p-3`}
                >
                  <div className="flex items-start justify-between gap-1">
                    <div>
                      <p className="font-medium leading-tight">{d.name}</p>
                      {d.partner && (
                        <p className="text-xs text-slate-500">{d.partner}</p>
                      )}
                    </div>
                    <button
                      onClick={() => remove(d.id)}
                      className="text-xs text-slate-300 hover:text-red-600"
                    >
                      ✕
                    </button>
                  </div>
                  {d.note && (
                    <p className="mt-1 text-xs text-slate-600">{d.note}</p>
                  )}
                  <input
                    defaultValue={d.next_step ?? ""}
                    onBlur={(e) => {
                      if (e.target.value !== (d.next_step ?? ""))
                        saveNext(d.id, e.target.value);
                    }}
                    placeholder="next step…"
                    className="mt-2 w-full rounded border border-slate-200 px-2 py-1 text-xs outline-none focus:border-ink"
                  />
                  <select
                    value={d.stage}
                    onChange={(e) => move(d.id, e.target.value as DealStage)}
                    className="mt-2 w-full rounded border border-slate-200 px-1 py-1 text-xs"
                  >
                    {STAGES.map((st) => (
                      <option key={st.value} value={st.value}>
                        Move to: {st.label}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {deals.length === 0 && (
        <p className="text-sm text-slate-500">
          No deals yet. Add your live partnerships above (Qualcomm, ABP, Aptech,
          Arduino…) to see your whole pipeline at a glance.
        </p>
      )}
    </div>
  );
}
