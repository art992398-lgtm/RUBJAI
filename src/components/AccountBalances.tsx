"use client";

import { Wallet, Landmark, CreditCard, CircleDollarSign, ArrowLeftRight } from "lucide-react";
import { formatMoney } from "@/lib/format";
import type { Account } from "@/lib/types";

const KIND_ICON: Record<Account["kind"], React.ReactNode> = {
  cash: <Wallet className="h-5 w-5" />,
  bank: <Landmark className="h-5 w-5" />,
  card: <CreditCard className="h-5 w-5" />,
  other: <CircleDollarSign className="h-5 w-5" />,
};

interface Props {
  accounts: Account[];
  balances: Record<string, number>;
  onTransfer: () => void;
}

export function AccountBalances({ accounts, balances, onTransfer }: Props) {
  if (accounts.length === 0) return null;

  return (
    <div className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-blush-700 dark:text-blush-200">
          ยอดคงเหลือต่อกระเป๋า
        </h2>
        <button
          onClick={onTransfer}
          className="flex items-center gap-1.5 rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-3 py-1.5 text-sm font-medium text-blush-700 dark:text-blush-200 hover:bg-blush-50 dark:hover:bg-plum-700"
        >
          <ArrowLeftRight className="h-4 w-4" /> โอนเงิน
        </button>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {accounts.map((a) => {
          const bal = balances[a.id] ?? 0;
          return (
            <div
              key={a.id}
              className="flex items-center gap-3 rounded-xl bg-blush-50 dark:bg-plum-800 px-4 py-3"
            >
              <span className="text-blush-500">{KIND_ICON[a.kind]}</span>
              <div>
                <div className="text-xs font-medium text-blush-500">{a.name}</div>
                <div
                  className={`text-lg font-bold ${
                    bal < 0 ? "text-rose-500" : "text-blush-700 dark:text-blush-100"
                  }`}
                >
                  {formatMoney(bal)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
