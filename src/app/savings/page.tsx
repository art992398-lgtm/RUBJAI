"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  PiggyBank,
  ArrowDownToLine,
  ArrowUpFromLine,
  Trash2,
  Check,
  Target,
  Wallet,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ToastProvider";
import { Navbar } from "@/components/Navbar";
import { Modal } from "@/components/Modal";
import { subscribeTransactions } from "@/lib/transactions";
import {
  subscribeSavings,
  addSaving,
  removeSaving,
  subscribeSavingsGoal,
  setSavingsGoal,
} from "@/lib/savings";
import { subscribeTransfers, addTransfer } from "@/lib/transfers";
import { accountBalances } from "@/lib/balances";
import type { Saving, Transaction, Transfer } from "@/lib/types";
import { formatMoney, formatDateThai, todayIso } from "@/lib/format";
import { monthLabel } from "@/lib/week";

const inputCls =
  "rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-3 py-2 text-sm outline-none focus:border-blush-500";

export default function SavingsPage() {
  const { user, loading } = useAuth();
  const { accounts, accountName } = useData();
  const router = useRouter();
  const { notify } = useToast();
  const [rows, setRows] = useState<Transaction[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [savings, setSavings] = useState<Saving[]>([]);
  const [ready, setReady] = useState(false);
  const [goal, setGoal] = useState(0);
  const [goalDraft, setGoalDraft] = useState("");

  const [collectTarget, setCollectTarget] = useState<{ key: string; net: number } | null>(null);
  const [collectTo, setCollectTo] = useState("");
  // amount pulled from each source account, keyed by account id
  const [collectAllocations, setCollectAllocations] = useState<Record<string, string>>({});
  const [collecting, setCollecting] = useState(false);

  const [withdrawOpen, setWithdrawOpen] = useState(false);
  const [withdraw, setWithdraw] = useState("");
  const [withdrawFrom, setWithdrawFrom] = useState("");
  const [withdrawTo, setWithdrawTo] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    let a = false,
      b = false;
    const done = () => a && b && setReady(true);
    const u1 = subscribeTransactions(user.uid, (r) => {
      setRows(r);
      a = true;
      done();
    });
    const u2 = subscribeSavings(user.uid, (s) => {
      setSavings(s);
      b = true;
      done();
    });
    const u3 = subscribeSavingsGoal(user.uid, (g) => {
      setGoal(g);
      setGoalDraft(g ? String(g) : "");
    });
    const u4 = subscribeTransfers(user.uid, setTransfers);
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [user]);

  const balances = useMemo(() => accountBalances(rows, transfers), [rows, transfers]);

  const pot = useMemo(
    () =>
      savings.reduce((s, r) => s + (r.type === "in" ? r.amount : -r.amount), 0),
    [savings]
  );

  const collectedMonths = useMemo(
    () => new Set(savings.filter((s) => s.type === "in" && s.month).map((s) => s.month)),
    [savings]
  );

  // net leftover per month from transactions
  const months = useMemo(() => {
    const m: Record<string, { income: number; expense: number }> = {};
    for (const r of rows) {
      const k = r.date.slice(0, 7);
      if (!m[k]) m[k] = { income: 0, expense: 0 };
      if (r.type === "income") m[k].income += r.amount;
      else m[k].expense += r.amount;
    }
    return Object.entries(m)
      .map(([key, v]) => ({
        key,
        net: v.income - v.expense,
        collected: collectedMonths.has(key),
      }))
      .sort((a, b) => (a.key < b.key ? 1 : -1));
  }, [rows, collectedMonths]);

  // account marked kind="savings" is the default destination/source for
  // collect/withdraw — matches the "park leftover in my savings account"
  // ritual most people actually do at month boundaries.
  const savingsAccount = accounts.find((a) => a.kind === "savings");
  const nonSavingsAccounts = accounts.filter((a) => a.id !== savingsAccount?.id);

  const openCollect = (key: string, net: number) => {
    setCollectTarget({ key, net });
    const to = savingsAccount?.id ?? accounts[1]?.id ?? accounts[0]?.id ?? "";
    setCollectTo(to);
    // one obvious source account -> prefill the full amount there; otherwise
    // leave blank so the user splits it across whichever accounts actually
    // hold the leftover.
    const sources = accounts.filter((a) => a.id !== to);
    setCollectAllocations(
      sources.length === 1 ? { [sources[0].id]: String(net) } : {}
    );
  };

  const collectSources = accounts.filter((a) => a.id !== collectTo);
  const collectAllocatedTotal = collectSources.reduce(
    (s, a) => s + (parseFloat(collectAllocations[a.id]) || 0),
    0
  );
  const collectOverAllocated = collectSources.some(
    (a) => (parseFloat(collectAllocations[a.id]) || 0) > (balances[a.id] ?? 0)
  );

  const confirmCollect = async () => {
    if (!user || !collectTarget || collectTarget.net <= 0) return;
    const { key, net } = collectTarget;
    const matchesNet = Math.abs(collectAllocatedTotal - net) < 0.005;
    if (collectAllocatedTotal > 0 && !matchesNet) {
      notify(`ยอดที่แบ่งจากบัญชี (${formatMoney(collectAllocatedTotal)}) ต้องเท่ากับเงินเหลือ (${formatMoney(net)})`, "error");
      return;
    }
    if (collectOverAllocated) {
      notify("มีบัญชีที่ดึงเงินเกินยอดคงเหลือ", "error");
      return;
    }
    const [y, mo] = key.split("-").map(Number);
    const lastDay = new Date(y, mo, 0).getDate();
    const date = `${key}-${String(lastDay).padStart(2, "0")}`;
    const note = `เงินเหลือ${monthLabel(y, mo - 1)}`;
    setCollecting(true);
    try {
      await addSaving(user.uid, { amount: net, type: "in", date, month: key, note });
      if (collectTo && matchesNet) {
        for (const a of collectSources) {
          const amt = parseFloat(collectAllocations[a.id]) || 0;
          if (amt <= 0) continue;
          await addTransfer(user.uid, {
            fromAccountId: a.id,
            toAccountId: collectTo,
            amount: amt,
            date,
            note,
          });
        }
      }
      notify("เก็บเงินเหลือเข้าออมแล้ว");
      setCollectTarget(null);
    } finally {
      setCollecting(false);
    }
  };

  const openWithdraw = () => {
    setWithdraw("");
    setWithdrawFrom(savingsAccount?.id ?? accounts[0]?.id ?? "");
    setWithdrawTo(nonSavingsAccounts[0]?.id ?? accounts[1]?.id ?? accounts[0]?.id ?? "");
    setWithdrawOpen(true);
  };

  const confirmWithdraw = async () => {
    if (!user) return;
    const v = parseFloat(withdraw);
    if (isNaN(v) || v <= 0) {
      notify("กรอกจำนวนเงินให้ถูกต้อง", "error");
      return;
    }
    if (v > pot) {
      notify("ถอนเกินยอดเงินออม", "error");
      return;
    }
    setWithdrawing(true);
    try {
      const date = todayIso();
      await addSaving(user.uid, { amount: v, type: "out", date, note: "ถอนจากเงินออม" });
      if (withdrawFrom && withdrawTo && withdrawFrom !== withdrawTo) {
        await addTransfer(user.uid, {
          fromAccountId: withdrawFrom,
          toAccountId: withdrawTo,
          amount: v,
          date,
          note: "ถอนจากเงินออม",
        });
      }
      notify("ถอนเงินออมแล้ว", "info");
      setWithdrawOpen(false);
    } finally {
      setWithdrawing(false);
    }
  };

  const commitGoal = async () => {
    if (!user) return;
    const v = parseFloat(goalDraft);
    const next = isNaN(v) || v < 0 ? 0 : v;
    if (next !== goal) {
      await setSavingsGoal(user.uid, next);
      notify("ตั้งเป้าหมายออมแล้ว");
    }
  };

  const goalPct = goal > 0 ? Math.min(100, (pot / goal) * 100) : 0;

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
          <PiggyBank className="h-5 w-5 text-blush-500" />
          <h1 className="text-lg font-bold text-blush-700 dark:text-blush-200">
            กระเป๋าเงินออม
          </h1>
        </div>

        {/* pot */}
        <div className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-gradient-to-b from-blush-100 to-white dark:from-plum-800 dark:to-plum-900/60 p-6 shadow-soft">
          <span className="text-sm font-medium text-blush-600 dark:text-blush-300">
            ยอดเงินออมสะสม
          </span>
          <p className="mt-1 text-3xl font-bold text-blush-700 dark:text-blush-100">
            {formatMoney(pot)}
          </p>

          {/* savings goal */}
          <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-blush-600 dark:text-blush-300">
            <Target className="h-4 w-4 text-blush-500" />
            <span>เป้าหมาย</span>
            <input
              type="number"
              min="0"
              step="1000"
              value={goalDraft}
              onChange={(e) => setGoalDraft(e.target.value)}
              onBlur={commitGoal}
              onKeyDown={(e) => {
                if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              }}
              placeholder="เช่น 50000"
              className="w-32 rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-2.5 py-1.5 text-sm outline-none focus:border-blush-500"
            />
          </div>
          {goal > 0 && (
            <div className="mt-3">
              <div className="mb-1 flex justify-between text-xs text-blush-500">
                <span>{goalPct.toFixed(0)}%</span>
                <span>{formatMoney(goal)}</span>
              </div>
              <div className="h-2.5 overflow-hidden rounded-full bg-blush-50 dark:bg-plum-800">
                <div
                  className="h-full rounded-full bg-blush-500 transition-all"
                  style={{ width: `${goalPct}%` }}
                />
              </div>
            </div>
          )}

          <div className="mt-4">
            <button
              onClick={openWithdraw}
              className="flex items-center gap-1.5 rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-3 py-2 text-sm font-medium text-blush-700 dark:text-blush-200 hover:bg-blush-50"
            >
              <ArrowUpFromLine className="h-4 w-4" /> ถอนเงินออม
            </button>
          </div>
        </div>

        {!ready ? (
          <div className="flex justify-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-blush-500" />
          </div>
        ) : (
          <>
            {/* monthly leftover -> collect */}
            <section className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
              <h2 className="mb-3 text-sm font-semibold text-blush-700 dark:text-blush-200">
                เงินเหลือแต่ละเดือน (เก็บเข้าออม)
              </h2>
              {months.length === 0 ? (
                <p className="text-sm text-blush-400">ยังไม่มีข้อมูลรายเดือน</p>
              ) : (
                <ul className="divide-y divide-blush-50 dark:divide-plum-800">
                  {months.map((m) => {
                    const [y, mo] = m.key.split("-").map(Number);
                    return (
                      <li
                        key={m.key}
                        className="flex items-center justify-between gap-2 py-2.5 text-sm"
                      >
                        <span className="text-blush-700 dark:text-blush-200">
                          {monthLabel(y, mo - 1)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span
                            className={`font-medium ${
                              m.net >= 0 ? "text-emerald-600" : "text-rose-500"
                            }`}
                          >
                            {formatMoney(m.net)}
                          </span>
                          {m.collected ? (
                            <span className="flex items-center gap-1 text-xs text-blush-400">
                              <Check className="h-3.5 w-3.5" /> เก็บแล้ว
                            </span>
                          ) : (
                            <button
                              onClick={() => openCollect(m.key, m.net)}
                              disabled={m.net <= 0}
                              className="flex items-center gap-1 rounded-lg bg-blush-500 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-blush-600 disabled:opacity-40"
                            >
                              <ArrowDownToLine className="h-3.5 w-3.5" /> เก็บเข้าออม
                            </button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>

            {/* history */}
            <section className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
              <h2 className="mb-3 text-sm font-semibold text-blush-700 dark:text-blush-200">
                ประวัติเงินออม
              </h2>
              {savings.length === 0 ? (
                <p className="text-sm text-blush-400">ยังไม่มีรายการ</p>
              ) : (
                <ul className="divide-y divide-blush-50 dark:divide-plum-800">
                  {savings.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-center justify-between gap-2 py-2.5 text-sm"
                    >
                      <div className="flex items-center gap-2">
                        {s.type === "in" ? (
                          <ArrowDownToLine className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <ArrowUpFromLine className="h-4 w-4 text-rose-500" />
                        )}
                        <div>
                          <div className="text-blush-800 dark:text-blush-100">
                            {s.note ?? (s.type === "in" ? "เก็บเข้าออม" : "ถอน")}
                          </div>
                          <div className="text-xs text-blush-400">
                            {formatDateThai(s.date)}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-medium ${
                            s.type === "in" ? "text-emerald-600" : "text-rose-500"
                          }`}
                        >
                          {s.type === "in" ? "+" : "-"}
                          {formatMoney(s.amount)}
                        </span>
                        <button
                          onClick={() => user && removeSaving(user.uid, s.id)}
                          className="text-blush-400 hover:text-rose-500"
                          aria-label="ลบ"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </main>

      {/* collect leftover -> confirm + optional real transfer */}
      <Modal
        open={!!collectTarget}
        onClose={() => setCollectTarget(null)}
        title="เก็บเข้าออม"
      >
        {collectTarget && (
          <div className="grid gap-3">
            <p className="text-sm text-blush-600 dark:text-blush-300">
              เก็บ <b className="text-blush-800 dark:text-blush-100">{formatMoney(collectTarget.net)}</b> เข้าออม
            </p>

            {accounts.length > 0 && (
              <>
                <label className="block">
                  <span className="mb-1 flex items-center gap-1 text-xs font-medium text-blush-600 dark:text-blush-300">
                    <Wallet className="h-3.5 w-3.5" /> เข้าบัญชีออม
                  </span>
                  <select
                    value={collectTo}
                    onChange={(e) => setCollectTo(e.target.value)}
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

                {collectTo && collectSources.length > 0 && (
                  <div className="rounded-xl border border-blush-100 dark:border-plum-800 p-3">
                    <span className="mb-2 flex items-center gap-1 text-xs font-medium text-blush-600 dark:text-blush-300">
                      <Wallet className="h-3.5 w-3.5" /> ดึงเงินมาจากบัญชีไหนบ้าง (ไม่บังคับ)
                    </span>
                    <div className="grid gap-2">
                      {collectSources.map((a) => {
                        const amt = parseFloat(collectAllocations[a.id]) || 0;
                        const bal = balances[a.id] ?? 0;
                        const over = amt > bal;
                        return (
                          <div key={a.id} className="flex items-center gap-2">
                            <span className="flex-1 text-sm text-blush-700 dark:text-blush-200">
                              {a.name}
                              <span className="ml-1 text-xs text-blush-400">
                                (เหลือ {formatMoney(bal)})
                              </span>
                            </span>
                            <input
                              type="number"
                              min="0"
                              value={collectAllocations[a.id] ?? ""}
                              onChange={(e) =>
                                setCollectAllocations((prev) => ({
                                  ...prev,
                                  [a.id]: e.target.value,
                                }))
                              }
                              placeholder="0"
                              className={`${inputCls} w-28 text-right ${
                                over ? "border-rose-400" : ""
                              }`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div
                      className={`mt-2 text-xs ${
                        collectOverAllocated
                          ? "text-rose-500"
                          : collectAllocatedTotal > 0 &&
                            Math.abs(collectAllocatedTotal - collectTarget.net) < 0.005
                          ? "text-emerald-600"
                          : "text-blush-500"
                      }`}
                    >
                      {collectOverAllocated
                        ? "มีบัญชีที่ดึงเงินเกินยอดคงเหลือ"
                        : `แบ่งแล้ว ${formatMoney(collectAllocatedTotal)} / ${formatMoney(
                            collectTarget.net
                          )}`}
                    </div>
                  </div>
                )}
              </>
            )}

            <div className="mt-1 grid grid-cols-2 gap-3">
              <button
                onClick={() => setCollectTarget(null)}
                className="rounded-xl border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 py-2.5 font-medium text-blush-600 dark:text-blush-300 hover:bg-blush-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={confirmCollect}
                disabled={
                  collecting ||
                  collectOverAllocated ||
                  (collectAllocatedTotal > 0 &&
                    Math.abs(collectAllocatedTotal - collectTarget.net) >= 0.005)
                }
                className="flex items-center justify-center gap-2 rounded-xl bg-blush-500 py-2.5 font-semibold text-white shadow-soft hover:bg-blush-600 disabled:opacity-60"
              >
                {collecting ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันเก็บ"}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* withdraw -> confirm + optional real transfer */}
      <Modal open={withdrawOpen} onClose={() => setWithdrawOpen(false)} title="ถอนเงินออม">
        <div className="grid gap-3">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-blush-600 dark:text-blush-300">
              จำนวนเงิน
            </span>
            <input
              type="number"
              min="0"
              value={withdraw}
              onChange={(e) => setWithdraw(e.target.value)}
              placeholder="จำนวนที่ถอน"
              className={inputCls + " w-full"}
            />
          </label>

          {accounts.length > 0 && (
            <>
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-xs font-medium text-blush-600 dark:text-blush-300">
                  <Wallet className="h-3.5 w-3.5" /> จากบัญชีออม (ไม่บังคับ)
                </span>
                <select
                  value={withdrawFrom}
                  onChange={(e) => setWithdrawFrom(e.target.value)}
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
              <label className="block">
                <span className="mb-1 flex items-center gap-1 text-xs font-medium text-blush-600 dark:text-blush-300">
                  <Wallet className="h-3.5 w-3.5" /> ไปบัญชี (ไม่บังคับ)
                </span>
                <select
                  value={withdrawTo}
                  onChange={(e) => setWithdrawTo(e.target.value)}
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
              {withdrawFrom && withdrawTo && withdrawFrom !== withdrawTo && (
                <p className="text-xs text-blush-400">
                  จะโอนเงินจริงจาก {accountName(withdrawFrom)} ไป {accountName(withdrawTo)} ด้วย
                </p>
              )}
            </>
          )}

          <div className="mt-1 grid grid-cols-2 gap-3">
            <button
              onClick={() => setWithdrawOpen(false)}
              className="rounded-xl border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 py-2.5 font-medium text-blush-600 dark:text-blush-300 hover:bg-blush-50"
            >
              ยกเลิก
            </button>
            <button
              onClick={confirmWithdraw}
              disabled={withdrawing}
              className="flex items-center justify-center gap-2 rounded-xl bg-blush-500 py-2.5 font-semibold text-white shadow-soft hover:bg-blush-600 disabled:opacity-60"
            >
              {withdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : "ยืนยันถอน"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
