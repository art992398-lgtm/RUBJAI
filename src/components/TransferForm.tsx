"use client";

import { useState } from "react";
import { ArrowLeftRight, Loader2 } from "lucide-react";
import { useData } from "@/lib/data-context";
import { todayIso } from "@/lib/format";
import type { Transfer } from "@/lib/types";

interface Props {
  onSubmit: (t: Omit<Transfer, "id" | "createdAt">) => Promise<void>;
}

export function TransferForm({ onSubmit }: Props) {
  const { accounts } = useData();
  const [fromAccountId, setFromAccountId] = useState(accounts[0]?.id ?? "");
  const [toAccountId, setToAccountId] = useState(accounts[1]?.id ?? accounts[0]?.id ?? "");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(todayIso());
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!fromAccountId || !toAccountId) {
      setError("เลือกกระเป๋าต้นทางและปลายทาง");
      return;
    }
    if (fromAccountId === toAccountId) {
      setError("กระเป๋าต้นทางและปลายทางต้องไม่เหมือนกัน");
      return;
    }
    if (isNaN(value) || value <= 0) {
      setError("กรอกจำนวนเงินให้ถูกต้อง");
      return;
    }
    setError("");
    setBusy(true);
    try {
      await onSubmit({
        fromAccountId,
        toAccountId,
        amount: value,
        date,
        ...(note.trim() ? { note: note.trim() } : {}),
      });
      setAmount("");
      setNote("");
    } finally {
      setBusy(false);
    }
  };

  if (accounts.length < 2) {
    return (
      <p className="text-sm text-blush-400">
        ต้องมีอย่างน้อย 2 กระเป๋าเงินก่อนถึงจะโอนได้ (เพิ่มได้ที่หน้าตั้งค่า)
      </p>
    );
  }

  return (
    <form onSubmit={submit} className="grid gap-3">
      <div className="grid grid-cols-2 gap-3">
        <Field label="จาก">
          <select
            value={fromAccountId}
            onChange={(e) => setFromAccountId(e.target.value)}
            className="input"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="ไปยัง">
          <select
            value={toAccountId}
            onChange={(e) => setToAccountId(e.target.value)}
            className="input"
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="วันที่">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input"
          required
        />
      </Field>

      <Field label="จำนวนเงิน">
        <input
          type="number"
          inputMode="decimal"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          className="input"
          required
        />
      </Field>

      <Field label="หมายเหตุ (ไม่บังคับ)">
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="เช่น เก็บเข้าออม"
          className="input"
        />
      </Field>

      {error && <p className="text-sm text-rose-500">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-1 flex w-full items-center justify-center gap-2 rounded-xl bg-blush-500 px-4 py-2.5 font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-blush-600 hover:shadow-md disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowLeftRight className="h-4 w-4" />}
        โอนเงิน
      </button>

      <style jsx>{`
        :global(.input) {
          width: 100%;
          border-radius: 0.75rem;
          border: 1px solid #ffd3e5;
          background: #fff;
          padding: 0.55rem 0.75rem;
          font-size: 0.9rem;
          color: #4a2b3a;
          outline: none;
        }
        :global(.input:focus) {
          border-color: #f76ba3;
          box-shadow: 0 0 0 3px rgba(247, 107, 163, 0.15);
        }
      `}</style>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-blush-600 dark:text-blush-300">
        {label}
      </span>
      {children}
    </label>
  );
}
