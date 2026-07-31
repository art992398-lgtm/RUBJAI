"use client";

import { useMemo, useState } from "react";
import {
  Trash2,
  Pencil,
  TrendingUp,
  TrendingDown,
  Inbox,
  Paperclip,
  Wallet,
} from "lucide-react";
import type { Transaction } from "@/lib/types";
import { useData } from "@/lib/data-context";
import { formatMoney, formatDateThai } from "@/lib/format";
import { Modal } from "./Modal";

interface Props {
  rows: Transaction[];
  onDelete: (id: string) => void;
  onEdit: (tx: Transaction) => void;
}

export function TransactionList({ rows, onDelete, onEdit }: Props) {
  const { labelOf, accountName } = useData();
  const [preview, setPreview] = useState<string | null>(null);

  // running balance oldest -> newest, display newest first
  const withBalance = useMemo(() => {
    const asc = [...rows].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return (a.createdAt ?? 0) - (b.createdAt ?? 0);
    });
    let bal = 0;
    const map = new Map<string, number>();
    for (const r of asc) {
      bal += r.type === "income" ? r.amount : -r.amount;
      map.set(r.id, bal);
    }
    return [...asc].reverse().map((r) => ({ tx: r, balance: map.get(r.id) ?? 0 }));
  }, [rows]);

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-blush-200 dark:border-plum-800 bg-white/60 dark:bg-plum-900/40 py-16 text-blush-500">
        <Inbox className="h-10 w-10" />
        <p className="text-sm">ไม่มีรายการที่ตรงกับเงื่อนไข</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 shadow-soft">
      <div className="hidden grid-cols-12 gap-2 border-b border-blush-100 dark:border-plum-800 bg-blush-50/60 dark:bg-plum-800 px-4 py-3 text-xs font-semibold text-blush-600 dark:text-blush-300 md:grid">
        <div className="col-span-2">วันที่</div>
        <div className="col-span-3">รายการ</div>
        <div className="col-span-2 text-right">รายรับ</div>
        <div className="col-span-2 text-right">รายจ่าย</div>
        <div className="col-span-3 text-right">คงเหลือ</div>
      </div>

      <ul className="divide-y divide-blush-50 dark:divide-plum-800">
        {withBalance.map(({ tx, balance }) => (
          <li
            key={tx.id}
            className="grid grid-cols-2 gap-2 px-4 py-3 text-sm transition hover:bg-blush-50/50 dark:hover:bg-plum-800/40 md:grid-cols-12 md:items-center"
          >
            <div className="col-span-1 text-blush-600 dark:text-blush-300 md:col-span-2">
              {formatDateThai(tx.date)}
            </div>

            <div className="col-span-1 min-w-0 md:col-span-3">
              <div className="flex items-center gap-2 font-medium text-blush-800 dark:text-blush-100">
                {tx.type === "income" ? (
                  <TrendingUp className="h-4 w-4 shrink-0 text-emerald-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 shrink-0 text-rose-500" />
                )}
                <span className="truncate">{tx.description}</span>
                {tx.receiptUrl && (
                  <button
                    type="button"
                    onClick={() => setPreview(tx.receiptUrl ?? null)}
                    className="shrink-0 text-blush-400 hover:text-blush-600"
                    title="ดูสลิป"
                    aria-label="ดูสลิป"
                  >
                    <Paperclip className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-blush-500">
                <span>{labelOf(tx.category)}</span>
                {accountName(tx.accountId) && (
                  <span className="flex items-center gap-0.5">
                    <Wallet className="h-3 w-3" />
                    {accountName(tx.accountId)}
                  </span>
                )}
                {tx.note && <span>· {tx.note}</span>}
              </div>
            </div>

            <div className="col-span-2 whitespace-nowrap text-right font-medium tabular-nums text-emerald-600 md:col-span-2">
              {tx.type === "income" ? formatMoney(tx.amount) : "—"}
            </div>
            <div className="col-span-2 whitespace-nowrap text-right font-medium tabular-nums text-rose-500 md:col-span-2">
              {tx.type === "expense" ? formatMoney(tx.amount) : "—"}
            </div>

            <div className="col-span-2 flex items-center justify-end gap-1 md:col-span-3">
              <span
                className={`mr-1 whitespace-nowrap tabular-nums font-semibold ${
                  balance >= 0
                    ? "text-blush-700 dark:text-blush-200"
                    : "text-rose-600"
                }`}
              >
                {formatMoney(balance)}
              </span>
              <button
                onClick={() => onEdit(tx)}
                aria-label="แก้ไข"
                className="shrink-0 rounded-lg p-1.5 text-blush-400 transition hover:bg-blush-50 dark:hover:bg-plum-800 hover:text-blush-600"
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                onClick={() => onDelete(tx.id)}
                aria-label="ลบรายการ"
                className="shrink-0 rounded-lg p-1.5 text-blush-400 transition hover:bg-rose-50 hover:text-rose-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Modal
        open={!!preview}
        onClose={() => setPreview(null)}
        title="สลิป / ใบเสร็จ"
      >
        {preview && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="สลิป"
            className="mx-auto max-h-[70vh] w-full rounded-xl object-contain"
          />
        )}
      </Modal>
    </div>
  );
}
