import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

interface Props {
  expense: number;
  prevExpense: number;
  income: number;
  prevIncome: number;
}

function pctChange(current: number, prev: number): number | null {
  if (prev === 0) return current === 0 ? 0 : null; // null = no baseline to compare
  return ((current - prev) / prev) * 100;
}

function Badge({
  label,
  pct,
  goodWhenDown,
}: {
  label: string;
  pct: number | null;
  goodWhenDown: boolean;
}) {
  const up = pct !== null && pct > 0.5;
  const down = pct !== null && pct < -0.5;
  const good = pct === null ? null : goodWhenDown ? down || pct === 0 : up || pct === 0;

  const color =
    pct === null
      ? "text-blush-400"
      : good
      ? "text-emerald-600"
      : up || down
      ? "text-rose-500"
      : "text-blush-500";

  return (
    <div className="flex items-center gap-1.5 rounded-full bg-blush-50 dark:bg-plum-800 px-3 py-1.5 text-xs font-medium">
      <span className="text-blush-500">{label}</span>
      <span className={`flex items-center gap-0.5 ${color}`}>
        {pct === null ? (
          "ไม่มีข้อมูลเทียบ"
        ) : up ? (
          <>
            <ArrowUpRight className="h-3.5 w-3.5" /> {pct.toFixed(0)}%
          </>
        ) : down ? (
          <>
            <ArrowDownRight className="h-3.5 w-3.5" /> {Math.abs(pct).toFixed(0)}%
          </>
        ) : (
          <>
            <Minus className="h-3.5 w-3.5" /> ใกล้เคียงเดิม
          </>
        )}
      </span>
    </div>
  );
}

export function MonthCompare({ expense, prevExpense, income, prevIncome }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge label="รายจ่ายเทียบเดือนก่อน" pct={pctChange(expense, prevExpense)} goodWhenDown />
      <Badge label="รายรับเทียบเดือนก่อน" pct={pctChange(income, prevIncome)} goodWhenDown={false} />
    </div>
  );
}
