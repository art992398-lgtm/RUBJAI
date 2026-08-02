import Link from "next/link";
import { CalendarRange, PiggyBank, Coins } from "lucide-react";
import { formatMoney } from "@/lib/format";

interface Props {
  weekLimit: number;
  weekSpent: number;
  daysLeft: number;
  totalSavings: number;
}

export function HomeWidget({ weekLimit, weekSpent, daysLeft, totalSavings }: Props) {
  const weekRemaining = weekLimit - weekSpent;
  const over = weekLimit > 0 && weekSpent > weekLimit;
  const perDay = weekLimit / 7; // fixed daily allowance, not remaining ÷ days left

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Link
        href="/budget"
        className="flex flex-col justify-between rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft transition hover:-translate-y-0.5 hover:shadow-md"
      >
        <div className="flex items-center justify-between">
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
        </div>
        {weekLimit > 0 && (
          <div className="mt-3 flex items-center gap-1.5 rounded-xl bg-blush-50 dark:bg-plum-800 px-3 py-2 text-xs text-blush-700 dark:text-blush-200">
            <Coins className="h-4 w-4 shrink-0 text-blush-500" />
            {over ? (
              <span>เกินงบแล้ว ลองคุมรายจ่ายที่เหลือของสัปดาห์</span>
            ) : (
              <span>
                เหลืออีก {daysLeft} วัน ใช้ได้อีกวันละ ~
                <b className="text-blush-800 dark:text-blush-100"> {formatMoney(perDay)}</b>
              </span>
            )}
          </div>
        )}
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
