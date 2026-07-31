"use client";

import { useId, useState } from "react";
import {
  Plus,
  Check,
  TrendingUp,
  TrendingDown,
  Loader2,
  Paperclip,
  X,
} from "lucide-react";
import { useData } from "@/lib/data-context";
import { fileToCompressedDataUrl } from "@/lib/receipts";
import { todayIso } from "@/lib/format";
import type { NewTransaction, Transaction, TxType } from "@/lib/types";

interface Props {
  onSubmit: (tx: NewTransaction) => Promise<void>;
  initial?: Transaction | null;
  embedded?: boolean;
  submitLabel?: string;
  noteSuggestions?: string[];
}

export function TransactionForm({
  onSubmit,
  initial = null,
  embedded = false,
  submitLabel,
  noteSuggestions = [],
}: Props) {
  const { categoriesForType, accounts } = useData();
  const noteListId = useId();

  const [type, setType] = useState<TxType>(initial?.type ?? "expense");
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [description, setDescription] = useState(initial?.description ?? "");
  const [category, setCategory] = useState(
    initial?.category ?? categoriesForType(initial?.type ?? "expense")[0].key
  );
  const [amount, setAmount] = useState(
    initial ? String(initial.amount) : ""
  );
  const [note, setNote] = useState(initial?.note ?? "");
  const [accountId, setAccountId] = useState(initial?.accountId ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [receiptUrl, setReceiptUrl] = useState(initial?.receiptUrl ?? "");
  const [busy, setBusy] = useState(false);

  const cats = categoriesForType(type);

  const switchType = (t: TxType) => {
    setType(t);
    setCategory(categoriesForType(t)[0].key);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const value = parseFloat(amount);
    if (!description.trim() || isNaN(value) || value <= 0) return;
    setBusy(true);
    try {
      let url = receiptUrl;
      if (file) {
        url = await fileToCompressedDataUrl(file);
      }
      const tx: NewTransaction = {
        type,
        date,
        description: description.trim(),
        category,
        amount: value,
        ...(note.trim() ? { note: note.trim() } : {}),
        ...(accountId ? { accountId } : {}),
        ...(url ? { receiptUrl: url } : {}),
      };
      await onSubmit(tx);
      if (!initial) {
        setDescription("");
        setAmount("");
        setNote("");
        setFile(null);
        setReceiptUrl("");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={submit}
      className={
        embedded
          ? ""
          : "rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft"
      }
    >
      {!embedded && (
        <h2 className="mb-4 text-base font-semibold text-blush-700 dark:text-blush-200">
          เพิ่มรายการใหม่
        </h2>
      )}

      {/* type toggle */}
      <div className="mb-4 grid grid-cols-2 gap-2 rounded-xl bg-blush-50 dark:bg-plum-800 p-1">
        <button
          type="button"
          onClick={() => switchType("income")}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
            type === "income"
              ? "bg-emerald-500 text-white shadow"
              : "text-blush-600 dark:text-blush-300"
          }`}
        >
          <TrendingUp className="h-4 w-4" /> รายรับ
        </button>
        <button
          type="button"
          onClick={() => switchType("expense")}
          className={`flex items-center justify-center gap-1.5 rounded-lg py-2 text-sm font-medium transition ${
            type === "expense"
              ? "bg-rose-500 text-white shadow"
              : "text-blush-600 dark:text-blush-300"
          }`}
        >
          <TrendingDown className="h-4 w-4" /> รายจ่าย
        </button>
      </div>

      <div className="grid gap-3">
        <Field label="วันที่">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="input"
            required
          />
        </Field>

        <Field label="รายการ / รายละเอียด">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="เช่น ค่าอาหารกลางวัน"
            className="input"
            required
          />
        </Field>

        <Field label="หมวดหมู่">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="input"
          >
            {cats.map((c) => (
              <option key={c.key} value={c.key}>
                {c.label}
                {c.hint ? ` — ${c.hint}` : ""}
              </option>
            ))}
          </select>
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

        {accounts.length > 0 && (
          <Field label="บัญชี / กระเป๋าเงิน">
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="input"
            >
              <option value="">— ไม่ระบุ —</option>
              {accounts.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
          </Field>
        )}

        <Field label="หมายเหตุ (เช่น ช่องทางการจ่ายเงิน)">
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="เช่น เงินสด / โอน / บัตรเครดิต"
            className="input"
            list={noteListId}
          />
          {noteSuggestions.length > 0 && (
            <datalist id={noteListId}>
              {noteSuggestions.map((n) => (
                <option key={n} value={n} />
              ))}
            </datalist>
          )}
        </Field>

        {/* receipt */}
        <div>
          <span className="mb-1 block text-xs font-medium text-blush-600 dark:text-blush-300">
            แนบสลิป / ใบเสร็จ (ไม่บังคับ)
          </span>
          {receiptUrl && !file ? (
            <div className="flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={receiptUrl}
                alt="receipt"
                className="h-12 w-12 rounded-lg border border-blush-200 dark:border-plum-800 object-cover"
              />
              <button
                type="button"
                onClick={() => setReceiptUrl("")}
                className="flex items-center gap-1 text-xs text-rose-500"
              >
                <X className="h-3.5 w-3.5" /> ลบรูป
              </button>
            </div>
          ) : (
            <label className="flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-blush-200 dark:border-plum-800 px-3 py-2 text-sm text-blush-500">
              <Paperclip className="h-4 w-4" />
              {file ? file.name : "เลือกรูปภาพ"}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={busy}
        className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-blush-500 px-4 py-2.5 font-semibold text-white shadow-soft transition hover:-translate-y-0.5 hover:bg-blush-600 hover:shadow-md disabled:opacity-60 disabled:hover:translate-y-0"
      >
        {busy ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : initial ? (
          <Check className="h-4 w-4" />
        ) : (
          <Plus className="h-4 w-4" />
        )}
        {submitLabel ?? (initial ? "บันทึกการแก้ไข" : "บันทึกรายการ")}
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

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-blush-600 dark:text-blush-300">
        {label}
      </span>
      {children}
    </label>
  );
}
