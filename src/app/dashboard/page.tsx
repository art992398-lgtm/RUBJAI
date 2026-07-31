"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ToastProvider";
import {
  subscribeTransactions,
  addTransaction,
  updateTransaction,
  removeTransaction,
} from "@/lib/transactions";
import { subscribeTransfers, addTransfer, removeTransfer } from "@/lib/transfers";
import { subscribeBudgets, type BudgetMap } from "@/lib/budgets";
import { subscribeSavings } from "@/lib/savings";
import { subscribeDebts } from "@/lib/debts";
import { accountBalances } from "@/lib/balances";
import { categoryOverageByRow } from "@/lib/categoryOverage";
import { postDueRecurring } from "@/lib/recurring";
import { exportTransactionsCsv } from "@/lib/exporters";
import { exportNodeAsPdf } from "@/lib/pdfExport";
import {
  weekKeyOf,
  todayIso as weekTodayIso,
  daysLeftInWeek,
  fromIso,
  toIso,
  monthLabel,
} from "@/lib/week";
import { formatMoney } from "@/lib/format";
import { notifyBrowser } from "@/lib/notify";
import type {
  NewTransaction,
  Transaction,
  Transfer,
  Saving,
  Debt,
} from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { SummaryCards } from "@/components/SummaryCards";
import { HomeWidget } from "@/components/HomeWidget";
import { AccountBalances } from "@/components/AccountBalances";
import { CategoryBudgetBars } from "@/components/CategoryBudgetBars";
import { MonthCompare } from "@/components/MonthCompare";
import { MonthlyReportTemplate } from "@/components/MonthlyReportTemplate";
import { TransactionForm } from "@/components/TransactionForm";
import { TransferForm } from "@/components/TransferForm";
import { TransactionList } from "@/components/TransactionList";
import { Charts } from "@/components/Charts";
import { FilterBar, type Filters } from "@/components/FilterBar";
import { Modal } from "@/components/Modal";
import { ConfirmDialog } from "@/components/ConfirmDialog";

export default function Dashboard() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const { recurring, labelOf, accountName, accounts, categoryBudgets, categoriesForType } =
    useData();

  const [rows, setRows] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [budgets, setBudgets] = useState<BudgetMap>({});
  const [savings, setSavings] = useState<Saving[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [addOpen, setAddOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [exportingPdf, setExportingPdf] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!user) return;
    const u1 = subscribeTransfers(user.uid, setTransfers);
    const u2 = subscribeBudgets(user.uid, setBudgets);
    const u3 = subscribeSavings(user.uid, setSavings);
    const u4 = subscribeDebts(user.uid, setDebts);
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [user]);

  // notify once per session if any debt is due within 3 days
  const dueAlerted = useRef(false);
  useEffect(() => {
    if (dueAlerted.current || debts.length === 0) return;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const soon = debts.filter((d) => {
      if (d.remaining <= 0) return false;
      const due = new Date(d.nextDueDate + "T00:00:00");
      const days = Math.round((due.getTime() - today.getTime()) / 86400000);
      return days >= 0 && days <= 3;
    });
    if (soon.length > 0) {
      dueAlerted.current = true;
      notifyBrowser(
        "งวดหนี้ใกล้ครบกำหนด",
        soon.map((d) => d.name).join(", ")
      );
    }
  }, [debts]);

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

  const prevTotals = useMemo(() => {
    let m = month0 - 1;
    let y = year;
    if (m < 0) {
      m = 11;
      y--;
    }
    const prevKey = `${y}-${String(m + 1).padStart(2, "0")}`;
    let income = 0;
    let expense = 0;
    for (const r of rows) {
      if (r.date.slice(0, 7) !== prevKey) continue;
      if (r.type === "income") income += r.amount;
      else expense += r.amount;
    }
    return { income, expense };
  }, [rows, year, month0]);

  const balances = useMemo(
    () => accountBalances(rows, transfers),
    [rows, transfers]
  );

  const reportCategories = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of monthRows) {
      if (r.type !== "expense") continue;
      m[r.category] = (m[r.category] ?? 0) + r.amount;
    }
    return Object.entries(m)
      .map(([key, amount]) => ({ label: labelOf(key), amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 6);
  }, [monthRows, labelOf]);

  const reportAccounts = useMemo(
    () => accounts.map((a) => ({ name: a.name, balance: balances[a.id] ?? 0 })),
    [accounts, balances]
  );

  const thisWeekKey = useMemo(() => weekKeyOf(weekTodayIso()), []);
  const thisWeekLimit = budgets[thisWeekKey] ?? 0;

  // categories with their own monthly budget only spill into the week
  // budget once they go over that limit — the overage, not the whole amount.
  const categoryOverage = useMemo(
    () => categoryOverageByRow(rows, categoryBudgets),
    [rows, categoryBudgets]
  );
  const thisWeekSpent = useMemo(
    () =>
      rows
        .filter((r) => r.type === "expense" && weekKeyOf(r.date) === thisWeekKey)
        .reduce((s, r) => {
          const amt =
            categoryBudgets[r.category] > 0
              ? categoryOverage.get(r.id) ?? 0
              : r.amount;
          return s + amt;
        }, 0),
    [rows, thisWeekKey, categoryBudgets, categoryOverage]
  );

  const thisWeekEnd = useMemo(() => {
    const d = fromIso(thisWeekKey);
    const lastDay = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const endDay = Math.min(d.getDate() + 6, lastDay);
    return toIso(new Date(d.getFullYear(), d.getMonth(), endDay));
  }, [thisWeekKey]);
  const thisWeekDaysLeft = daysLeftInWeek(thisWeekKey, thisWeekEnd);

  const noteSuggestions = useMemo(() => {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const r of rows) {
      if (r.note && !seen.has(r.note)) {
        seen.add(r.note);
        out.push(r.note);
      }
      if (out.length >= 20) break;
    }
    return out;
  }, [rows]);

  const totalSavings = useMemo(
    () => savings.reduce((s, r) => s + (r.type === "in" ? r.amount : -r.amount), 0),
    [savings]
  );

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

  const handleTransfer = async (t: Omit<Transfer, "id" | "createdAt">) => {
    if (!user) return;
    await addTransfer(user.uid, t);
    notify("โอนเงินแล้ว");
    setTransferOpen(false);
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

  const doExportPdf = async () => {
    if (!reportRef.current) return;
    setExportingPdf(true);
    try {
      await exportNodeAsPdf(reportRef.current, `rubjai-report-${monthKey}.pdf`);
      notify("ดาวน์โหลดรายงาน PDF แล้ว");
    } catch {
      notify("สร้าง PDF ไม่สำเร็จ", "error");
    } finally {
      setExportingPdf(false);
    }
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
        <HomeWidget
          weekLimit={thisWeekLimit}
          weekSpent={thisWeekSpent}
          daysLeft={thisWeekDaysLeft}
          totalSavings={totalSavings}
        />

        <SummaryCards
          income={totals.income}
          expense={totals.expense}
          balance={totals.balance}
        />

        <MonthCompare
          expense={totals.expense}
          prevExpense={prevTotals.expense}
          income={totals.income}
          prevIncome={prevTotals.income}
        />

        <AccountBalances
          accounts={accounts}
          balances={balances}
          onTransfer={() => setTransferOpen(true)}
        />

        <CategoryBudgetBars
          categories={categoriesForType("expense")}
          budgets={categoryBudgets}
          rows={monthRows}
          labelOf={labelOf}
        />

        <Charts monthRows={monthRows} allRows={rows} />

        <div className="grid gap-6 lg:grid-cols-[360px_1fr] lg:items-start">
          <div className="hidden space-y-6 lg:block">
            <TransactionForm onSubmit={handleAdd} noteSuggestions={noteSuggestions} />
          </div>

          <div className="space-y-4">
            <FilterBar
              year={year}
              month0={month0}
              onMonth={changeMonth}
              filters={filters}
              onFilters={setFilters}
              onExport={doExport}
              onExportPdf={doExportPdf}
              exportingPdf={exportingPdf}
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
        <TransactionForm onSubmit={handleAdd} embedded noteSuggestions={noteSuggestions} />
      </Modal>

      {/* transfer modal */}
      <Modal open={transferOpen} onClose={() => setTransferOpen(false)} title="โอนระหว่างกระเป๋า">
        <TransferForm onSubmit={handleTransfer} />
        {transfers.length > 0 && (
          <div className="mt-5 border-t border-blush-100 dark:border-plum-800 pt-4">
            <h3 className="mb-2 text-xs font-semibold text-blush-500">
              ประวัติการโอนล่าสุด
            </h3>
            <ul className="space-y-1.5">
              {transfers.slice(0, 5).map((t) => (
                <li
                  key={t.id}
                  className="flex items-center justify-between rounded-lg bg-blush-50 dark:bg-plum-800 px-3 py-2 text-xs"
                >
                  <span className="text-blush-700 dark:text-blush-200">
                    {accountName(t.fromAccountId)} → {accountName(t.toAccountId)}
                    {t.note ? ` · ${t.note}` : ""}
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="font-medium text-blush-600 dark:text-blush-300">
                      {formatMoney(t.amount)}
                    </span>
                    <button
                      onClick={() => user && removeTransfer(user.uid, t.id)}
                      aria-label="ลบ"
                      className="text-blush-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
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
            noteSuggestions={noteSuggestions}
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

      {/* off-screen node captured for PDF export */}
      <MonthlyReportTemplate
        ref={reportRef}
        monthLabel={monthLabel(year, month0)}
        income={totals.income}
        expense={totals.expense}
        balance={totals.balance}
        categories={reportCategories}
        accounts={reportAccounts}
        generatedAt={new Date().toLocaleDateString("th-TH", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        })}
      />
    </div>
  );
}
