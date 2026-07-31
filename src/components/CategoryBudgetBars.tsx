"use client";

import { useMemo } from "react";
import { Target } from "lucide-react";
import type { Transaction } from "@/lib/types";
import type { CategoryDef } from "@/lib/categories";
import { formatMoney } from "@/lib/format";

interface Props {
  categories: CategoryDef[];
  budgets: Record<string, number>; // categoryKey -> monthly limit
  rows: Transaction[]; // this month's rows
  labelOf: (k: string) => string;
}

export function CategoryBudgetBars({ categories, budgets, rows, labelOf }: Props) {
  const spent = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of rows) {
      if (r.type !== "expense") continue;
      m[r.category] = (m[r.category] ?? 0) + r.amount;
    }
    return m;
  }, [rows]);

  const items = categories
    .map((c) => ({
      key: c.key,
      label: labelOf(c.key),
      limit: budgets[c.key] ?? 0,
      used: spent[c.key] ?? 0,
    }))
    .filter((x) => x.limit > 0);

  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <Target className="h-5 w-5 text-blush-500" />
        <h2 className="text-base font-semibold text-blush-700 dark:text-blush-200">
          งบต่อหมวดหมู่ (เดือนนี้)
        </h2>
      </div>
      <ul className="space-y-3">
        {items.map((i) => {
          const pct = Math.min(100, (i.used / i.limit) * 100);
          const over = i.used > i.limit;
          const bar = over
            ? "bg-rose-500"
            : pct >= 80
            ? "bg-amber-400"
            : "bg-emerald-400";
          return (
            <li key={i.key}>
              <div className="mb-1 flex justify-between text-xs">
                <span className="text-blush-700 dark:text-blush-200">
                  {i.label}
                </span>
                <span
                  className={
                    over ? "font-medium text-rose-500" : "text-blush-500"
                  }
                >
                  {formatMoney(i.used)} / {formatMoney(i.limit)}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-blush-50 dark:bg-plum-800">
                <div
                  className={`h-full rounded-full ${bar}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
