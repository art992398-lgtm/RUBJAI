"use client";

import { useMemo } from "react";
import { PieChart, BarChart3 } from "lucide-react";
import type { Transaction } from "@/lib/types";
import { useData } from "@/lib/data-context";
import { formatMoney } from "@/lib/format";

const DONUT_COLORS = [
  "#f76ba3",
  "#ff8bb8",
  "#ffb3d1",
  "#e84c8a",
  "#c73a70",
  "#ffd3e5",
  "#f9a8c9",
];

const THAI_MON = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

export function Charts({
  monthRows,
  allRows,
}: {
  monthRows: Transaction[];
  allRows: Transaction[];
}) {
  const { labelOf } = useData();

  const donut = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of monthRows) {
      if (r.type !== "expense") continue;
      m[r.category] = (m[r.category] ?? 0) + r.amount;
    }
    const entries = Object.entries(m)
      .map(([k, v]) => ({ key: k, label: labelOf(k), value: v }))
      .sort((a, b) => b.value - a.value);
    const total = entries.reduce((s, e) => s + e.value, 0);
    return { entries, total };
  }, [monthRows, labelOf]);

  const trend = useMemo(() => {
    // last 6 months
    const months: { key: string; label: string; income: number; expense: number }[] =
      [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        label: THAI_MON[d.getMonth()],
        income: 0,
        expense: 0,
      });
    }
    const idx = new Map(months.map((m, i) => [m.key, i]));
    for (const r of allRows) {
      const k = r.date.slice(0, 7);
      const i = idx.get(k);
      if (i === undefined) continue;
      if (r.type === "income") months[i].income += r.amount;
      else months[i].expense += r.amount;
    }
    const max = Math.max(
      1,
      ...months.map((m) => Math.max(m.income, m.expense))
    );
    return { months, max };
  }, [allRows]);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      {/* donut */}
      <div className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-blush-500" />
          <h2 className="text-base font-semibold text-blush-700 dark:text-blush-200">
            สัดส่วนรายจ่าย (เดือนนี้)
          </h2>
        </div>
        {donut.total === 0 ? (
          <p className="py-8 text-center text-sm text-blush-400">
            ยังไม่มีรายจ่ายในเดือนนี้
          </p>
        ) : (
          <div className="flex items-center gap-5">
            <Donut entries={donut.entries} total={donut.total} />
            <ul className="flex-1 space-y-1.5">
              {donut.entries.map((e, i) => (
                <li
                  key={e.key}
                  className="flex items-center gap-2 text-xs text-blush-600 dark:text-blush-300"
                >
                  <span
                    className="h-3 w-3 shrink-0 rounded-full"
                    style={{
                      background: DONUT_COLORS[i % DONUT_COLORS.length],
                    }}
                  />
                  <span className="flex-1 truncate">{e.label}</span>
                  <span className="font-medium">
                    {Math.round((e.value / donut.total) * 100)}%
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* trend */}
      <div className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blush-500" />
          <h2 className="text-base font-semibold text-blush-700 dark:text-blush-200">
            แนวโน้ม 6 เดือน
          </h2>
        </div>
        <div className="flex h-40 items-end justify-between gap-2">
          {trend.months.map((m) => (
            <div
              key={m.key}
              className="flex flex-1 flex-col items-center gap-1"
            >
              <div className="flex h-32 w-full items-end justify-center gap-1">
                <div
                  className="w-3 rounded-t bg-emerald-400 transition-all"
                  style={{ height: `${(m.income / trend.max) * 100}%` }}
                  title={`รายรับ ${formatMoney(m.income)}`}
                />
                <div
                  className="w-3 rounded-t bg-rose-400 transition-all"
                  style={{ height: `${(m.expense / trend.max) * 100}%` }}
                  title={`รายจ่าย ${formatMoney(m.expense)}`}
                />
              </div>
              <span className="text-[11px] text-blush-500">{m.label}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 flex justify-center gap-4 text-xs text-blush-600 dark:text-blush-300">
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" /> รายรับ
          </span>
          <span className="flex items-center gap-1">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-400" /> รายจ่าย
          </span>
        </div>
      </div>
    </div>
  );
}

function Donut({
  entries,
  total,
}: {
  entries: { key: string; value: number }[];
  total: number;
}) {
  const R = 42;
  const C = 2 * Math.PI * R;
  let offset = 0;
  return (
    <svg viewBox="0 0 100 100" className="h-32 w-32 -rotate-90">
      <circle cx="50" cy="50" r={R} fill="none" stroke="#ffe9f2" strokeWidth="14" />
      {entries.map((e, i) => {
        const frac = e.value / total;
        const dash = frac * C;
        const seg = (
          <circle
            key={e.key}
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={DONUT_COLORS[i % DONUT_COLORS.length]}
            strokeWidth="14"
            strokeDasharray={`${dash} ${C - dash}`}
            strokeDashoffset={-offset}
          />
        );
        offset += dash;
        return seg;
      })}
    </svg>
  );
}
