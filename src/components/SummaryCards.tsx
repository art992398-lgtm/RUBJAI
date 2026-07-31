import { TrendingUp, TrendingDown, Wallet } from "lucide-react";
import { formatBaht } from "@/lib/format";

interface Props {
  income: number;
  expense: number;
  balance: number;
}

export function SummaryCards({ income, expense, balance }: Props) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <Card
        title="รายรับรวม"
        value={income}
        icon={<TrendingUp className="h-5 w-5" />}
        accent="text-emerald-600"
        ring="from-emerald-50 to-white"
      />
      <Card
        title="รายจ่ายรวม"
        value={expense}
        icon={<TrendingDown className="h-5 w-5" />}
        accent="text-rose-500"
        ring="from-rose-50 to-white"
      />
      <Card
        title="ยอดคงเหลือ"
        value={balance}
        icon={<Wallet className="h-5 w-5" />}
        accent={balance >= 0 ? "text-blush-700 dark:text-blush-200" : "text-rose-600"}
        ring="from-blush-100 to-white"
      />
    </div>
  );
}

function Card({
  title,
  value,
  icon,
  accent,
  ring,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  accent: string;
  ring: string;
}) {
  return (
    <div
      className={`rounded-2xl border border-blush-100 dark:border-plum-800 bg-gradient-to-b ${ring} p-5 shadow-soft`}
    >
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-blush-600 dark:text-blush-300">{title}</span>
        <span className={accent}>{icon}</span>
      </div>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{formatBaht(value)}</p>
    </div>
  );
}
