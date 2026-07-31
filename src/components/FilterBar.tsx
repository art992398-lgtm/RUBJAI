"use client";

import {
  ChevronLeft,
  ChevronRight,
  Search,
  Download,
  FileText,
  Filter,
} from "lucide-react";
import { useData } from "@/lib/data-context";
import { monthLabel } from "@/lib/week";
import type { TxType } from "@/lib/types";

export interface Filters {
  search: string;
  type: "all" | TxType;
  category: string;
  accountId: string;
}

interface Props {
  year: number;
  month0: number;
  onMonth: (delta: number) => void;
  filters: Filters;
  onFilters: (f: Filters) => void;
  onExport: () => void;
  onExportPdf: () => void;
  exportingPdf?: boolean;
}

export function FilterBar({
  year,
  month0,
  onMonth,
  filters,
  onFilters,
  onExport,
  onExportPdf,
  exportingPdf,
}: Props) {
  const { categoriesForType, accounts } = useData();
  const cats =
    filters.type === "income"
      ? categoriesForType("income")
      : filters.type === "expense"
      ? categoriesForType("expense")
      : [...categoriesForType("income"), ...categoriesForType("expense")];

  const set = (patch: Partial<Filters>) =>
    onFilters({ ...filters, ...patch });

  return (
    <div className="space-y-3 rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-4 shadow-soft">
      {/* month + export */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMonth(-1)}
            className="rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 p-1.5 text-blush-600 dark:text-blush-300"
            aria-label="เดือนก่อน"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <span className="min-w-[120px] text-center text-sm font-semibold text-blush-700 dark:text-blush-200">
            {monthLabel(year, month0)}
          </span>
          <button
            onClick={() => onMonth(1)}
            className="rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 p-1.5 text-blush-600 dark:text-blush-300"
            aria-label="เดือนถัดไป"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onExport}
            className="flex items-center gap-1.5 rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-3 py-1.5 text-sm font-medium text-blush-700 dark:text-blush-200 hover:bg-blush-50"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">CSV</span>
          </button>
          <button
            onClick={onExportPdf}
            disabled={exportingPdf}
            className="flex items-center gap-1.5 rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-3 py-1.5 text-sm font-medium text-blush-700 dark:text-blush-200 hover:bg-blush-50 disabled:opacity-60"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">
              {exportingPdf ? "กำลังสร้าง..." : "รายงาน PDF"}
            </span>
          </button>
        </div>
      </div>

      {/* search */}
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-blush-400" />
        <input
          value={filters.search}
          onChange={(e) => set({ search: e.target.value })}
          placeholder="ค้นหารายการ / หมายเหตุ"
          className="w-full rounded-xl border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 py-2 pl-9 pr-3 text-sm outline-none focus:border-blush-500"
        />
      </div>

      {/* filters */}
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="h-4 w-4 text-blush-400" />
        <select
          value={filters.type}
          onChange={(e) =>
            set({ type: e.target.value as Filters["type"], category: "" })
          }
          className="rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-2.5 py-1.5 text-sm text-blush-700 dark:text-blush-200"
        >
          <option value="all">ทุกประเภท</option>
          <option value="income">รายรับ</option>
          <option value="expense">รายจ่าย</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) => set({ category: e.target.value })}
          className="rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-2.5 py-1.5 text-sm text-blush-700 dark:text-blush-200"
        >
          <option value="">ทุกหมวดหมู่</option>
          {cats.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>

        {accounts.length > 0 && (
          <select
            value={filters.accountId}
            onChange={(e) => set({ accountId: e.target.value })}
            className="rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-2.5 py-1.5 text-sm text-blush-700 dark:text-blush-200"
          >
            <option value="">ทุกบัญชี</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
      </div>
    </div>
  );
}
