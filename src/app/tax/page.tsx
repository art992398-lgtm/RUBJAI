"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, ChevronLeft, ChevronRight, Receipt, Info } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { subscribeTransactions } from "@/lib/transactions";
import type { Transaction } from "@/lib/types";
import { Navbar } from "@/components/Navbar";
import { formatMoney } from "@/lib/format";

export default function TaxPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { labelOf } = useData();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [ready, setReady] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeTransactions(user.uid, (r) => {
      setRows(r);
      setReady(true);
    });
    return () => unsub();
  }, [user]);

  const summary = useMemo(() => {
    const yr = String(year);
    const inYear = rows.filter((r) => r.date.slice(0, 4) === yr);
    let income = 0;
    let expense = 0;
    const incomeByCat: Record<string, number> = {};
    const expenseByCat: Record<string, number> = {};
    for (const r of inYear) {
      if (r.type === "income") {
        income += r.amount;
        incomeByCat[r.category] = (incomeByCat[r.category] ?? 0) + r.amount;
      } else {
        expense += r.amount;
        expenseByCat[r.category] = (expenseByCat[r.category] ?? 0) + r.amount;
      }
    }
    return {
      count: inYear.length,
      income,
      expense,
      net: income - expense,
      incomeByCat: Object.entries(incomeByCat).sort((a, b) => b[1] - a[1]),
      expenseByCat: Object.entries(expenseByCat).sort((a, b) => b[1] - a[1]),
    };
  }, [rows, year]);

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
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-blush-500" />
            <h1 className="text-lg font-bold text-blush-700 dark:text-blush-200">
              สรุปภาษีรายปี
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setYear((y) => y - 1)}
              className="rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 p-1.5 text-blush-600 dark:text-blush-300"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="min-w-[90px] text-center text-sm font-semibold text-blush-700 dark:text-blush-200">
              ปี {year + 543} ({year})
            </span>
            <button
              onClick={() => setYear((y) => y + 1)}
              className="rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 p-1.5 text-blush-600 dark:text-blush-300"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {!ready ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blush-500" />
          </div>
        ) : (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Tile label="รายได้รวมทั้งปี" value={summary.income} tone="text-emerald-600" />
              <Tile label="รายจ่ายรวมทั้งปี" value={summary.expense} tone="text-rose-500" />
              <Tile
                label="คงเหลือสุทธิ"
                value={summary.net}
                tone={summary.net >= 0 ? "text-blush-700 dark:text-blush-200" : "text-rose-600"}
              />
            </div>

            <Section title="รายได้แยกตามประเภท (สำหรับยื่นเงินได้)">
              {summary.incomeByCat.length === 0 ? (
                <Empty />
              ) : (
                summary.incomeByCat.map(([k, v]) => (
                  <Row key={k} label={labelOf(k)} value={v} />
                ))
              )}
            </Section>

            <Section title="รายจ่ายแยกตามประเภท (ค่าลดหย่อน/ค่าใช้จ่าย)">
              {summary.expenseByCat.length === 0 ? (
                <Empty />
              ) : (
                summary.expenseByCat.map(([k, v]) => (
                  <Row key={k} label={labelOf(k)} value={v} />
                ))
              )}
            </Section>

            <div className="flex items-start gap-2 rounded-2xl border border-blush-100 dark:border-plum-800 bg-blush-50/60 dark:bg-plum-800/50 p-4 text-xs text-blush-600 dark:text-blush-300">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                ตัวเลขนี้เป็นการสรุปเบื้องต้นจากรายการที่บันทึกไว้
                ใช้เป็นข้อมูลอ้างอิงประกอบการยื่นภาษี ไม่ใช่คำแนะนำทางภาษี
                โปรดตรวจสอบกับกรมสรรพากรหรือผู้เชี่ยวชาญก่อนยื่นจริง
              </p>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: number; tone: string }) {
  return (
    <div className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
      <span className="text-sm font-medium text-blush-600 dark:text-blush-300">{label}</span>
      <p className={`mt-2 text-xl font-bold ${tone}`}>{formatMoney(value)}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
      <h2 className="mb-3 text-sm font-semibold text-blush-700 dark:text-blush-200">{title}</h2>
      <div className="divide-y divide-blush-50 dark:divide-plum-800">{children}</div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2 text-sm">
      <span className="text-blush-600 dark:text-blush-300">{label}</span>
      <span className="font-medium text-blush-800 dark:text-blush-100">{formatMoney(value)}</span>
    </div>
  );
}

function Empty() {
  return <p className="py-3 text-sm text-blush-400">ไม่มีข้อมูลในปีนี้</p>;
}
