"use client";

import { useCallback, useEffect, useState } from "react";
import type { Person } from "@/lib/types";
import { addPerson, deletePerson, getPeople } from "@/lib/store";

export default function PeoplePanel() {
  const [people, setPeople] = useState<Person[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setPeople(await getPeople());
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const add = async () => {
    if (!name.trim()) return;
    setError(null);
    try {
      await addPerson({
        name: name.trim(),
        email: email.trim() || undefined,
        role: role.trim() || undefined,
      });
      setName("");
      setEmail("");
      setRole("");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save");
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <h3 className="font-semibold">Team directory</h3>
      <p className="mt-1 text-sm text-slate-600">
        Add your team so delegation auto-fills the right person and opens Teams
        in one tap.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Name"
          className="w-36 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-ink"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@getsetlearn.info"
          className="min-w-[180px] flex-1 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-ink"
        />
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="role (optional)"
          className="w-36 rounded-md border border-slate-300 px-2 py-1.5 text-sm outline-none focus:border-ink"
        />
        <button
          onClick={add}
          className="rounded-md bg-ink px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-700"
        >
          + Add
        </button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}

      {people.length > 0 && (
        <ul className="mt-3 space-y-1">
          {people.map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-md border border-slate-100 px-3 py-1.5 text-sm"
            >
              <span>
                <span className="font-medium">{p.name}</span>
                {p.role ? ` · ${p.role}` : ""}
                {p.email ? ` · ${p.email}` : ""}
              </span>
              <button
                onClick={async () => {
                  await deletePerson(p.id);
                  load();
                }}
                className="text-xs text-slate-400 hover:text-red-600"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
