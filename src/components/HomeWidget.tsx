import Link from "next/link";
import { CalendarRange, PiggyBank } from "lucide-react";
import { formatMoney } from "@/lib/format";

interface Props {
  weekLimit: number;
  weekSpent: number;
  totalSavings: number;
}

export function HomeWidget({ weekLimit, weekSpent, totalSavings }: Props) {
  const weekRemaining = weekLimit - weekSpent;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/budget"
        className="flex items-center justify-between rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div>
          <span className="text-sm font-medium text-blush-600 dark:text-blush-300">
            งบสัปดาห์นี้เหลือ
          </span>
          <p
            className={`mt-1 text-2xl font-bold ${
              weekLimit === 0
                ? "text-blush-400"
                : weekRemaining < 0
                ? "text-rose-500"
                : "text-emerald-600"
            }`}
          >
            {weekLimit === 0 ? "ยังไม่ตั้งงบ" : formatMoney(weekRemaining)}
          </p>
        </div>
        <CalendarRange className="h-6 w-6 text-blush-400" />
      </Link>

      <Link
        href="/savings"
        className="flex items-center justify-between rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div>
          <span className="text-sm font-medium text-blush-600 dark:text-blush-300">
            เงินออมรวม
          </span>
          <p className="mt-1 text-2xl font-bold text-blush-700 dark:text-blush-100">
            {formatMoney(totalSavings)}
          </p>
        </div>
        <PiggyBank className="h-6 w-6 text-blush-400" />
      </Link>
    </div>
  );
}
