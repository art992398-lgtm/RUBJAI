"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  CreditCard,
  Plus,
  Trash2,
  CheckCircle2,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ToastProvider";
import { Navbar } from "@/components/Navbar";
import { Modal } from "@/components/Modal";
import {
  subscribeDebts,
  addDebt,
  removeDebt,
  payInstallment,
} from "@/lib/debts";
import { addTransaction } from "@/lib/transactions";
import type { Debt } from "@/lib/types";
import { formatMoney, formatDateThai, todayIso } from "@/lib/format";

const inputCls =
  "rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-3 py-2 text-sm outline-none focus:border-blush-500";
const btnCls =
  "flex items-center gap-1 rounded-lg bg-blush-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blush-600";

export default function DebtPage() {
  const { user, loading } = useAuth();
  const { accounts } = useData();
  const router = useRouter();
  const { notify } = useToast();
  const [debts, setDebts] = useState<Debt[]>([]);
  const [ready, setReady] = useState(false);

  const [name, setName] = useState("");
  const [principal, setPrincipal] = useState("");
  const [monthlyPayment, setMonthlyPayment] = useState("");
  const [nextDueDate, setNextDueDate] = useState(todayIso());

  const [payTarget, setPayTarget] = useState<Debt | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payAccountId, setPayAccountId] = useState("");
  const [paying, setPaying] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeDebts(user.uid, (rows) => {
      setDebts(rows);
      setReady(true);
    });
    return () => unsub();
  }, [user]);

  const create = async () => {
    const p = parseFloat(principal);
    const m = parseFloat(monthlyPayment);
    if (!name.trim() || isNaN(p) || p <= 0 || isNaN(m) || m <= 0) {
      notify("กรอกข้อมูลให้ครบและถูกต้อง", "error");
      return;
    }
    if (!user) return;
    await addDebt(user.uid, {
      name: name.trim(),
      principal: p,
      remaining: p,
      monthlyPayment: m,
      nextDueDate,
    });
    setName("");
    setPrincipal("");
    setMonthlyPayment("");
    notify("เพิ่มรายการหนี้แล้ว");
  };

  const openPay = (d: Debt) => {
    setPayTarget(d);
    setPayAmount(String(Math.min(d.monthlyPayment, d.remaining)));
    setPayAccountId(accounts[0]?.id ?? "");
  };

  const confirmPay = async () => {
    if (!user || !payTarget) return;
    const amount = parseFloat(payAmount);
    if (isNaN(amount) || amount <= 0) {
      notify("กรอกจำนวนเงินให้ถูกต้อง", "error");
      return;
    }
    setPaying(true);
    try {
      await addTransaction(user.uid, {
        type: "expense",
        date: todayIso(),
        description: `ผ่อน ${payTarget.name}`,
        category: "fixed",
        amount,
        ...(payAccountId ? { accountId: payAccountId } : {}),
      });
      await payInstallment(user.uid, payTarget, amount);
      notify(
        payTarget.remaining - amount <= 0
          ? `ผ่อน "${payTarget.name}" หมดแล้ว 🎉`
          : `จ่ายงวด "${payTarget.name}" แล้ว`
      );
      setPayTarget(null);
    } finally {
      setPaying(false);
    }
  };

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
        <div className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-blush-500" />
          <h1 className="text-lg font-bold text-blush-700 dark:text-blush-200">
            หนี้ / ของผ่อน
          </h1>
        </div>

        {/* add form */}
        <section className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
          <h2 className="mb-3 text-sm font-semibold text-blush-700 dark:text-blush-200">
            เพิ่มรายการหนี้ / ของผ่อน
          </h2>
          <div className="grid gap-2 sm:grid-cols-2">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="ชื่อ เช่น iPhone ผ่อน, สินเชื่อรถ"
              className={`${inputCls} sm:col-span-2`}
            />
            <input
              type="number"
              min="0"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              placeholder="ยอดรวมทั้งหมด"
              className={inputCls}
            />
            <input
              type="number"
              min="0"
              value={monthlyPayment}
              onChange={(e) => setMonthlyPayment(e.target.value)}
              placeholder="ยอดผ่อนต่องวด"
              className={inputCls}
            />
            <label className="flex items-center gap-2 text-sm text-blush-600 dark:text-blush-300 sm:col-span-2">
              งวดถัดไปวันที่
              <input
                type="date"
                value={nextDueDate}
                onChange={(e) => setNextDueDate(e.target.value)}
                className={inputCls}
              />
            </label>
            <button onClick={create} className={`${btnCls} justify-center sm:col-span-2`}>
              <Plus className="h-4 w-4" /> เพิ่มรายการ
            </button>
          </div>
        </section>

        {/* list */}
        {!ready ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blush-500" />
          </div>
        ) : debts.length === 0 ? (
          <p className="py-8 text-center text-sm text-blush-400">
            ยังไม่มีรายการหนี้ / ของผ่อน
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {debts.map((d) => {
              const pct = d.principal > 0 ? Math.min(100, ((d.principal - d.remaining) / d.principal) * 100) : 0;
              const paidOff = d.remaining <= 0;
              return (
                <div
                  key={d.id}
                  className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft"
                >
                  <div className="flex items-start justify-between">
                    <h3 className="font-semibold text-blush-700 dark:text-blush-200">
                      {d.name}
                    </h3>
                    <button
                      onClick={() => user && removeDebt(user.uid, d.id)}
                      aria-label="ลบ"
                      className="text-blush-400 hover:text-rose-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="mt-3">
                    <div className="mb-1 flex justify-between text-xs text-blush-600 dark:text-blush-300">
                      <span>เหลือ {formatMoney(d.remaining)}</span>
                      <span>ทั้งหมด {formatMoney(d.principal)}</span>
                    </div>
                    <div className="h-2.5 overflow-hidden rounded-full bg-blush-50 dark:bg-plum-800">
                      <div
                        className="h-full rounded-full bg-blush-500 transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-sm">
                    {paidOff ? (
                      <span className="flex items-center gap-1 font-medium text-emerald-600">
                        <CheckCircle2 className="h-4 w-4" /> ผ่อนหมดแล้ว
                      </span>
                    ) : (
                      <span className="text-blush-500">
                        งวดถัดไป {formatDateThai(d.nextDueDate)} ·{" "}
                        {formatMoney(d.monthlyPayment)}
                      </span>
                    )}
                  </div>

                  {!paidOff && (
                    <button
                      onClick={() => openPay(d)}
                      className="mt-3 w-full rounded-lg bg-blush-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blush-600"
                    >
                      จ่ายงวดนี้
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* pay installment confirm */}
      <Modal
        open={!!payTarget}
        onClose={() => setPayTarget(null)}
        title={payTarget ? `จ่ายงวด "${payTarget.name}"` : ""}
      >
        <div className="grid gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-blush-600 dark:text-blush-300">
              จำนวนเงิน
            </span>
            <input
              type="number"
              min="0"
              value={payAmount}
              onChange={(e) => setPayAmount(e.target.value)}
              className={inputCls + " w-full"}
            />
          </label>

          {accounts.length > 0 && (
            <label className="block">
              <span className="mb-1 flex items-center gap-1 text-xs font-medium text-blush-600 dark:text-blush-300">
                <Wallet className="h-3.5 w-3.5" /> จ่ายจากกระเป๋า
              </span>
              <select
                value={payAccountId}
                onChange={(e) => setPayAccountId(e.target.value)}
                className={inputCls + " w-full"}
              >
                <option value="">— ไม่ระบุ —</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </label>
          )}

          <div className="mt-1 grid grid-cols-2 gap-3">
            <button
              onClick={() => setPayTarget(null)}
              className="rounded-xl border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 py-2.5 font-medium text-blush-600 dark:text-blush-300 hover:bg-blush-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={confirmPay}
              disabled={paying}
              className="flex items-center justify-center gap-2 rounded-xl bg-blush-500 py-2.5 font-semibold text-white shadow-soft hover:bg-blush-600 disabled:opacity-60"
            >
              {paying ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันจ่าย"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
