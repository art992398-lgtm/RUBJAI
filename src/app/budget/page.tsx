"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  ChevronLeft,
  ChevronRight,
  Wand2,
  CalendarRange,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ToastProvider";
import { Navbar } from "@/components/Navbar";
import { WeekBudgetCard } from "@/components/WeekBudgetCard";
import { CategoryBudgetBars } from "@/components/CategoryBudgetBars";
import { subscribeTransactions } from "@/lib/transactions";
import { subscribeBudgets, setBudget, type BudgetMap } from "@/lib/budgets";
import type { Transaction } from "@/lib/types";
import { weeksOfMonth, weekKeyOf, monthLabel, isCurrentWeek } from "@/lib/week";
import { formatBaht } from "@/lib/format";

export default function BudgetPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { notify } = useToast();
  const { categoryBudgets, categoriesForType, labelOf } = useData();
  const alerted = useRef(false);
  const [rows, setRows] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<BudgetMap>({});
  const [ready, setReady] = useState(false);
  const [quick, setQuick] = useState("");

  // selected month anchor
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let a = false;
    let b = false;
    const done = () => {
      if (a && b) setReady(true);
    };
    const u1 = subscribeTransactions(user.uid, (r) => {
      setRows(r);
      a = true;
      done();
    });
    const u2 = subscribeBudgets(user.uid, (m) => {
      setBudgets(m);
      b = true;
      done();
    });
    return () => {
      u1();
      u2();
    };
  }, [user]);

  const weeks = useMemo(() => weeksOfMonth(year, month0), [year, month0]);

  const monthKey = `${year}-${String(month0 + 1).padStart(2, "0")}`;
  const monthRows = useMemo(
    () => rows.filter((r) => r.date.slice(0, 7) === monthKey),
    [rows, monthKey]
  );

  // spend per week — 7-day block anchored to day 1 of month. Each week
  // belongs to exactly one month, so summing the shown weeks never
  // double-counts a boundary week across two months.
  const spentByWeek = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) {
      if (r.type !== "expense") continue;
      const k = weekKeyOf(r.date);
      m[k] = (m[k] ?? 0) + r.amount;
    }
    return m;
  }, [rows]);

  // alert once when current week crosses 80% / 100%
  useEffect(() => {
    if (alerted.current) return;
    const cur = weeks.find((w) => isCurrentWeek(w.start, w.end));
    if (!cur) return;
    const limit = budgets[cur.key] ?? 0;
    if (limit <= 0) return;
    const spent = spentByWeek[cur.key] ?? 0;
    const pct = (spent / limit) * 100;
    if (pct >= 100) {
      alerted.current = true;
      notify("ใช้เงินเกินงบสัปดาห์นี้แล้ว", "error");
    } else if (pct >= 80) {
      alerted.current = true;
      notify("ใช้งบสัปดาห์นี้เกิน 80% แล้ว ระวังหน่อย", "info");
    }
  }, [weeks, budgets, spentByWeek, notify]);

  const totals = useMemo(() => {
    let limit = 0;
    let spent = 0;
    for (const w of weeks) {
      limit += budgets[w.key] ?? 0;
      spent += spentByWeek[w.key] ?? 0;
    }
    return { limit, spent, remaining: limit - spent };
  }, [weeks, budgets, spentByWeek]);

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

  const save = async (weekKey: string, limit: number) => {
    if (!user) return;
    await setBudget(user.uid, weekKey, limit);
    notify("บันทึกงบสัปดาห์แล้ว", "success");
  };

  const applyAll = async () => {
    if (!user) return;
    const v = parseFloat(quick);
    if (isNaN(v) || v < 0) {
      notify("กรอกจำนวนเงินให้ถูกต้อง", "error");
      return;
    }
    await Promise.all(weeks.map((w) => setBudget(user.uid, w.key, v)));
    setQuick("");
    notify(`ตั้งงบ ${weeks.length} สัปดาห์แล้ว`, "success");
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
        {/* month selector */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarRange className="h-5 w-5 text-blush-500" />
            <h1 className="text-lg font-bold text-blush-700 dark:text-blush-200">งบรายสัปดาห์</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => changeMonth(-1)}
              className="rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 p-1.5 text-blush-600 dark:text-blush-300 hover:bg-blush-50 dark:bg-plum-800"
              aria-label="เดือนก่อนหน้า"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[130px] text-center text-sm font-semibold text-blush-700 dark:text-blush-200">
              {monthLabel(year, month0)}
            </span>
            <button
              onClick={() => changeMonth(1)}
              className="rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 p-1.5 text-blush-600 dark:text-blush-300 hover:bg-blush-50 dark:bg-plum-800"
              aria-label="เดือนถัดไป"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* month summary */}
        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryTile label="งบรวมทั้งเดือน" value={totals.limit} tone="text-blush-700 dark:text-blush-200" />
          <SummaryTile label="ใช้ไปแล้ว" value={totals.spent} tone="text-rose-500" />
          <SummaryTile
            label="คงเหลือ"
            value={totals.remaining}
            tone={totals.remaining >= 0 ? "text-emerald-600" : "text-rose-600"}
          />
        </div>

        {/* quick set all */}
        <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/70 dark:bg-plum-900/50 p-4">
          <Wand2 className="h-4 w-4 text-blush-500" />
          <span className="text-sm font-medium text-blush-600 dark:text-blush-300">
            ตั้งงบเท่ากันทุกสัปดาห์
          </span>
          <input
            type="number"
            min="0"
            step="50"
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="เช่น 1200"
            className="w-32 rounded-lg border border-blush-200 dark:border-plum-800 px-3 py-1.5 text-sm outline-none focus:border-blush-500"
          />
          <button
            onClick={applyAll}
            className="rounded-lg bg-blush-500 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blush-600"
          >
            ใช้กับทุกสัปดาห์
          </button>
        </div>

        {/* category budgets */}
        <CategoryBudgetBars
          categories={categoriesForType("expense")}
          budgets={categoryBudgets}
          rows={monthRows}
          labelOf={labelOf}
        />

        {/* weeks */}
        {!ready ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blush-500" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {weeks.map((w) => (
              <WeekBudgetCard
                key={w.key}
                week={w}
                limit={budgets[w.key] ?? 0}
                spent={spentByWeek[w.key] ?? 0}
                onSave={(v) => save(w.key, v)}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function SummaryTile({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: string;
}) {
  return (
    <div className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
      <span className="text-sm font-medium text-blush-600 dark:text-blush-300">{label}</span>
      <p className={`mt-2 text-2xl font-bold ${tone}`}>{formatBaht(value)}</p>
    </div>
  );
}
