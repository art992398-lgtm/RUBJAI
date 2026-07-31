"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ToastProvider";
import {
  subscribeTransactions,
  addTransaction,
  updateTransaction,
  removeTransaction,
} from "@/lib/transactions";
import { postDueRecurring } from "@/lib/recurring";
import { exportTransactionsCsv } from "@/lib/exporters";
import type { NewTransaction, Transaction } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { SummaryCards } from "@/components/SummaryCards";
import { TransactionForm } from "@/components/TransactionForm";
import { TransactionList } from "@/components/TransactionList";
import { Charts } from "@/components/Charts";
import { FilterBar, type Filters } from "@/components/FilterBar";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const { recurring, labelOf, accountName } = useData();

  const [rows, setRows] = useState<Transaction[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());
  const [filters, setFilters] = useState<Filters>({
    search: "",
    type: "all",
    category: "",
    accountId: "",
  });

  const recurringDone = useRef(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    setDataLoading(true);
    const unsub = subscribeTransactions(user.uid, (r) => {
      setRows(r);
      setDataLoading(false);
    });
    return () => unsub();
  }, [user]);

  // auto-post recurring once per session load
  useEffect(() => {
    if (!user || recurringDone.current || recurring.length === 0) return;
    recurringDone.current = true;
    postDueRecurring(user.uid, recurring).then((n) => {
      if (n > 0) notify(`เพิ่มรายการประจำอัตโนมัติ ${n} รายการ`, "info");
    });
  }, [user, recurring, notify]);

  const monthKey = `${year}-${String(month0 + 1).padStart(2, "0")}`;

  const monthRows = useMemo(
    () => rows.filter((r) => r.date.slice(0, 7) === monthKey),
    [rows, monthKey]
  );

  const filtered = useMemo(() => {
    const q = filters.search.trim().toLowerCase();
    return monthRows.filter((r) => {
      if (filters.type !== "all" && r.type !== filters.type) return false;
      if (filters.category && r.category !== filters.category) return false;
      if (filters.accountId && r.accountId !== filters.accountId) return false;
      if (q) {
        const hay = `${r.description} ${r.note ?? ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [monthRows, filters]);

  const totals = useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const r of monthRows) {
      if (r.type === "income") income += r.amount;
      else expense += r.amount;
    }
    return { income, expense, balance: income - expense };
  }, [monthRows]);

  const changeMonth = (delta: number) => {
    let m = month0 + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y--;
    } else if (m > 11) {
      m = 0;
      y++;
    }
    setMonth0(m);
    setYear(y);
  };

  const handleAdd = async (tx: NewTransaction) => {
    if (!user) return;
    await addTransaction(user.uid, tx);
    notify(tx.type === "income" ? "บันทึกรายรับแล้ว" : "บันทึกรายจ่ายแล้ว");
    setAddOpen(false);
  };

  const handleUpdate = async (tx: NewTransaction) => {
    if (!user || !editing) return;
    await updateTransaction(user.uid, editing.id, tx);
    notify("แก้ไขรายการแล้ว");
    setEditing(null);
  };

  const confirmDelete = async () => {
    if (!user || !pendingDelete) return;
    await removeTransaction(user.uid, pendingDelete.id);
    notify("ลบรายการแล้ว", "info");
  };

  const doExport = () => {
    if (filtered.length === 0) {
      notify("ไม่มีรายการให้ export", "error");
      return;
    }
    exportTransactionsCsv(
      filtered,
      labelOf,
      accountName,
      `rubjai-${monthKey}.csv`
    );
    notify("ดาวน์โหลด CSV แล้ว");
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blush-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pb-safe mx-auto max-w-5xl space-y-6 px-4 py-6">
        <SummaryCards
          income={totals.income}
          expense={totals.expense}
          balance={totals.balance}
        />

        <Charts monthRows={monthRows} allRows={rows} />

        <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
          <div className="hidden space-y-6 lg:block">
            <TransactionForm onSubmit={handleAdd} />
          </div>

          <div className="space-y-4">
            <FilterBar
              year={year}
              month0={month0}
              onMonth={changeMonth}
              filters={filters}
              onFilters={setFilters}
              onExport={doExport}
            />

            <div className="flex items-center justify-between">
              <h2 className="text-base font-semibold text-blush-700 dark:text-blush-200">
                ประวัติรายการ
              </h2>
              <span className="text-sm text-blush-500">
                {filtered.length} รายการ
              </span>
            </div>

            {dataLoading ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-blush-500" />
              </div>
            ) : (
              <TransactionList
                rows={filtered}
                onDelete={(id) =>
                  setPendingDelete(rows.find((r) => r.id === id) ?? null)
                }
                onEdit={(tx) => setEditing(tx)}
              />
            )}
          </div>
        </div>
      </main>

      {/* mobile FAB */}
      <button
        onClick={() => setAddOpen(true)}
        aria-label="เพิ่มรายการ"
        className="fixed bottom-20 right-5 z-30 flex h-14 w-14 items-center justify-center rounded-full bg-blush-500 text-white shadow-soft transition hover:bg-blush-600 active:scale-90 lg:hidden"
      >
        <Plus className="h-7 w-7" />
      </button>

      {/* add modal (mobile) */}
      <Modal open={addOpen} onClose={() => setAddOpen(false)} title="เพิ่มรายการใหม่">
        <TransactionForm onSubmit={handleAdd} embedded />
      </Modal>

      {/* edit modal */}
      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title="แก้ไขรายการ"
      >
        {editing && (
          <TransactionForm
            onSubmit={handleUpdate}
            initial={editing}
            embedded
          />
        )}
      </Modal>

      {/* delete confirm */}
      <ConfirmDialog
        open={!!pendingDelete}
        title="ลบรายการ"
        message={
          pendingDelete
            ? `ต้องการลบ "${pendingDelete.description}" ใช่หรือไม่? การลบไม่สามารถกู้คืนได้`
            : ""
        }
        confirmLabel="ลบ"
        onConfirm={confirmDelete}
        onClose={() => setPendingDelete(null)}
      />
    </div>
  );
}
