"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, CheckCircle2, CalendarDays, Coins } from "lucide-react";
import type { WeekInfo } from "@/lib/week";
import { daysLeftInWeek, isCurrentWeek } from "@/lib/week";
import { formatBaht } from "@/lib/format";

interface Props {
  week: WeekInfo;
  limit: number;
  spent: number;
  onSave: (limit: number) => void;
}

export function WeekBudgetCard({ week, limit, spent, onSave }: Props) {
  const [draft, setDraft] = useState(limit ? String(limit) : "");

  // keep input in sync when remote value changes
  useEffect(() => {
    setDraft(limit ? String(limit) : "");
  }, [limit]);

  const commit = () => {
    const v = parseFloat(draft);
    const next = isNaN(v) || v < 0 ? 0 : v;
    if (next !== limit) onSave(next);
  };

  const remaining = limit - spent;
  const pct = limit > 0 ? Math.min(100, (spent / limit) * 100) : 0;
  const over = limit > 0 && spent > limit;
  const current = isCurrentWeek(week.start, week.end);

  const barColor = over
    ? "bg-rose-500"
    : pct >= 80
    ? "bg-amber-400"
    : "bg-emerald-400";

  const daysLeft = current ? daysLeftInWeek(week.start, week.end) : 0;
  const perDay = current && remaining > 0 && daysLeft > 0 ? remaining / daysLeft : 0;

  return (
    <div
      className={`rounded-2xl border bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft ${
        current ? "border-blush-300 ring-2 ring-blush-200" : "border-blush-100 dark:border-plum-800"
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-blush-700 dark:text-blush-200">{week.label}</h3>
            {current && (
              <span className="rounded-full bg-blush-500 px-2 py-0.5 text-[11px] font-medium text-white">
                สัปดาห์นี้
              </span>
            )}
          </div>
          <p className="mt-0.5 flex items-center gap-1 text-xs text-blush-500">
            <CalendarDays className="h-3.5 w-3.5" />
            {week.range}
          </p>
        </div>
        <div className="text-right">
          <label className="block text-[11px] font-medium text-blush-500">
            งบสัปดาห์ (บาท)
          </label>
          <input
            type="number"
            min="0"
            step="50"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            placeholder="0"
            className="mt-0.5 w-28 rounded-lg border border-blush-200 dark:border-plum-800 px-2.5 py-1.5 text-right text-sm outline-none focus:border-blush-500 focus:ring-2 focus:ring-blush-200"
          />
        </div>
      </div>

      {/* progress */}
      <div className="mt-4">
        <div className="mb-1 flex justify-between text-xs text-blush-600 dark:text-blush-300">
          <span>ใช้ไป {formatBaht(spent)}</span>
          <span>งบ {formatBaht(limit)}</span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-blush-50 dark:bg-plum-800">
          <div
            className={`h-full rounded-full transition-all ${barColor}`}
            style={{ width: `${limit > 0 ? pct : 0}%` }}
          />
        </div>
      </div>

      {/* status */}
      <div className="mt-3 flex items-center justify-between text-sm">
        {limit === 0 ? (
          <span className="text-blush-400">ยังไม่ตั้งงบ</span>
        ) : over ? (
          <span className="flex items-center gap-1 font-medium text-rose-600">
            <AlertTriangle className="h-4 w-4" />
            เกินงบ {formatBaht(spent - limit)}
          </span>
        ) : (
          <span className="flex items-center gap-1 font-medium text-emerald-600">
            <CheckCircle2 className="h-4 w-4" />
            เหลือ {formatBaht(remaining)}
          </span>
        )}
      </div>

      {/* daily suggestion */}
      {current && limit > 0 && (
        <div className="mt-3 flex items-center gap-2 rounded-xl bg-blush-50 dark:bg-plum-800 px-3 py-2 text-xs text-blush-700 dark:text-blush-200">
          <Coins className="h-4 w-4 text-blush-500" />
          {over ? (
            <span>เกินงบแล้ว ลองคุมรายจ่ายที่เหลือของสัปดาห์</span>
          ) : (
            <span>
              เหลืออีก {daysLeft} วัน ใช้ได้อีกวันละ ~
              <b className="text-blush-800 dark:text-blush-100"> {formatBaht(perDay)}</b>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
