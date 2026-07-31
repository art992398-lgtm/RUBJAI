"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  PiggyBank,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trash2,
  Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ToastProvider";
import { Navbar } from "@/components/Navbar";
import { subscribeTransactions } from "@/lib/transactions";
import { subscribeSavings, addSaving, removeSaving } from "@/lib/savings";
import type { Saving, Transaction } from "@/lib/types";
import { formatMoney, formatDateThai } from "@/lib/format";
import { monthLabel } from "@/lib/week";

export default function SavingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [ready, setReady] = useState(false);
  const [withdraw, setWithdraw] = useState("");

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let a = false,
      b = false;
    const done = () => a && b && setReady(true);
    const u1 = subscribeTransactions(user.uid, (r) => {
      setRows(r);
      a = true;
      done();
    });
    const u2 = subscribeSavings(user.uid, (s) => {
      setSavings(s);
      b = true;
      done();
    });
    return () => {
      u1();
      u2();
    };
  }, [user]);

  const pot = useMemo(
    () =>
      savings.reduce((s, r) => s + (r.type === "in" ? r.amount : -r.amount), 0),
    [savings]
  );

  const collectedMonths = useMemo(
    () => new Set(savings.filter((s) => s.type === "in" && s.month).map((s) => s.month)),
    [savings]
  );

  // net leftover per month from transactions
  const months = useMemo(() => {
    const m: Record<string, { income: number; expense: number }> = {};
    for (const r of rows) {
      const k = r.date.slice(0, 7);
      if (!m[k]) m[k] = { income: 0, expense: 0 };
      if (r.type === "income") m[k].income += r.amount;
      else m[k].expense += r.amount;
    }
    return Object.entries(m)
      .map(([key, v]) => ({
        key,
        net: v.income - v.expense,
        collected: collectedMonths.has(key),
      }))
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [rows, collectedMonths]);

  const collect = async (key: string, net: number) => {
    if (!user || net <= 0) return;
    const [y, mo] = key.split("-").map(Number);
    const lastDay = new Date(y, mo, 0).getDate();
    await addSaving(user.uid, {
      amount: net,
      type: "in",
      date: `${key}-${String(lastDay).padStart(2, "0")}`,
      month: key,
      note: `เงินเหลือ${monthLabel(y, mo - 1)}`,
    });
    notify("เก็บเงินเหลือเข้าออมแล้ว");
  };

  const doWithdraw = async () => {
    if (!user) return;
    const v = parseFloat(withdraw);
    if (isNaN(v) || v <= 0) {
      notify("กรอกจำนวนเงินให้ถูกต้อง", "error");
      return;
    }
    if (v > pot) {
      notify("ถอนเกินยอดเงินออม", "error");
      return;
    }
    await addSaving(user.uid, {
      amount: v,
      type: "out",
      date: new Date().toISOString().slice(0, 10),
      note: "ถอนจากเงินออม",
    });
    setWithdraw("");
    notify("ถอนเงินออมแล้ว", "info");
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
      <main className="pb-safe mx-auto max-w-3xl space-y-6 px-4 py-6">
        <div className="flex items-center gap-2">
          <PiggyBank className="h-5 w-5 text-blush-500" />
          <h1 className="text-lg font-bold text-blush-700 dark:text-blush-200">
            กระเป๋าเงินออม
          </h1>
        </div>

        {/* pot */}
        <div className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-gradient-to-b from-blush-100 to-white dark:from-plum-800 dark:to-plum-900/60 p-6 shadow-soft">
          <span className="text-sm font-medium text-blush-600 dark:text-blush-300">
            ยอดเงินออมสะสม
          </span>
          <p className="mt-1 text-3xl font-bold text-blush-700 dark:text-blush-100">
            {formatMoney(pot)}
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              type="number"
              min="0"
              value={withdraw}
              onChange={(e) => setWithdraw(e.target.value)}
              placeholder="จำนวนที่ถอน"
              className="w-40 rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-3 py-2 text-sm outline-none focus:border-blush-500"
            />
            <button
              onClick={doWithdraw}
              className="flex items-center gap-1.5 rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-3 py-2 text-sm font-medium text-blush-700 dark:text-blush-200 hover:bg-blush-50"
            >
              <ArrowUpFromLine className="h-4 w-4" /> ถอน
            </button>
          </div>
        </div>

        {!ready ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blush-500" />
          </div>
        ) : (
          <>
            {/* monthly leftover -> collect */}
            <section className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
              <h2 className="mb-3 text-sm font-semibold text-blush-700 dark:text-blush-200">
                เงินเหลือแต่ละเดือน (เก็บเข้าออม)
              </h2>
              {months.length === 0 ? (
                <p className="text-sm text-blush-400">ยังไม่มีข้อมูลรายเดือน</p>
              ) : (
                <ul className="divide-y divide-blush-50 dark:divide-plum-800">
                  {months.map((m) => {
                    const [y, mo] = m.key.split("-").map(Number);
                    return (
                      <li
                        key={m.key}
                        className="flex items-center justify-between gap-2 py-2.5 text-sm"
                      >
                        <span className="text-blush-700 dark:text-blush-200">
                          {monthLabel(y, mo - 1)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-medium ${
                              m.net >= 0 ? "text-emerald-600" : "text-rose-500"
                            }`}
                          >
                            {formatMoney(m.net)}
                          </span>
                          {m.collected ? (
                            <span className="flex items-center gap-1 text-xs text-blush-400">
                              <Check className="h-3.5 w-3.5" /> เก็บแล้ว
                            </span>
                          ) : (
                            <button
                              onClick={() => collect(m.key, m.net)}
                              disabled={m.net <= 0}
                              className="flex items-center gap-1 rounded-lg bg-blush-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blush-600 disabled:opacity-40"
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" /> เก็บเข้าออม
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* history */}
            <section className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
              <h2 className="mb-3 text-sm font-semibold text-blush-700 dark:text-blush-200">
                ประวัติเงินออม
              </h2>
              {savings.length === 0 ? (
                <p className="text-sm text-blush-400">ยังไม่มีรายการ</p>
              ) : (
                <ul className="divide-y divide-blush-50 dark:divide-plum-800">
                  {savings.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {s.type === "in" ? (
                          <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ArrowUpFromLine className="h-4 w-4 text-rose-500" />
                        )}
                        <div>
                          <div className="text-blush-800 dark:text-blush-100">
                            {s.note ?? (s.type === "in" ? "เก็บเข้าออม" : "ถอน")}
                          </div>
                          <div className="text-xs text-blush-400">
                            {formatDateThai(s.date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            s.type === "in" ? "text-emerald-600" : "text-rose-500"
                          }`}
                        >
                          {s.type === "in" ? "+" : "-"}
                          {formatMoney(s.amount)}
                        </span>
                        <button
                          onClick={() => user && removeSaving(user.uid, s.id)}
                          className="text-blush-400 hover:text-rose-500"
                          aria-label="ลบ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
