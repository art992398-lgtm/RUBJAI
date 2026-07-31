"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  Wallet,
  Tag,
  Repeat,
  Trash2,
  Plus,
  Palette,
  Target,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ToastProvider";
import { Navbar } from "@/components/Navbar";
import { CURRENCIES, formatMoney } from "@/lib/format";
import type { TxType } from "@/lib/types";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.replace("/");
  }, [user, loading, router]);

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
        <h1 className="text-lg font-bold text-blush-700 dark:text-blush-200">
          ตั้งค่า
        </h1>
        <Appearance />
        <Accounts />
        <Categories />
        <CategoryBudgets />
        <Recurring />
      </main>
    </div>
  );
}

function Card({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-5 shadow-soft">
      <div className="mb-4 flex items-center gap-2">
        <span className="text-blush-500">{icon}</span>
        <h2 className="text-base font-semibold text-blush-700 dark:text-blush-200">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

const inputCls =
  "rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-3 py-2 text-sm outline-none focus:border-blush-500";
const btnCls =
  "flex items-center gap-1 rounded-lg bg-blush-500 px-3 py-2 text-sm font-semibold text-white hover:bg-blush-600";

function Appearance() {
  const { theme, toggleTheme, currency, setCurrency } = useSettings();
  return (
    <Card icon={<Palette className="h-5 w-5" />} title="ธีม & สกุลเงิน">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="text-sm text-blush-600 dark:text-blush-300">โหมดมืด</span>
          <button
            onClick={toggleTheme}
            className={`relative h-6 w-11 rounded-full transition-colors ${
              theme === "dark" ? "bg-blush-500" : "bg-blush-200"
            }`}
            aria-label="สลับโหมดมืด"
          >
            <span
              className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all ${
                theme === "dark" ? "left-[22px]" : "left-0.5"
              }`}
            />
          </button>
        </div>
        <label className="flex items-center gap-2 text-sm text-blush-600 dark:text-blush-300">
          สกุลเงิน
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            className={inputCls}
          >
            {Object.entries(CURRENCIES).map(([code, meta]) => (
              <option key={code} value={code}>
                {meta.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </Card>
  );
}

function Accounts() {
  const { accounts, addAccount, removeAccount } = useData();
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [kind, setKind] = useState<"cash" | "bank" | "card" | "other">("cash");

  const add = async () => {
    if (!name.trim()) return;
    await addAccount({ name: name.trim(), kind });
    setName("");
    notify("เพิ่มบัญชีแล้ว");
  };

  const KIND_LABEL: Record<string, string> = {
    cash: "เงินสด",
    bank: "ธนาคาร",
    card: "บัตร",
    other: "อื่นๆ",
  };

  return (
    <Card icon={<Wallet className="h-5 w-5" />} title="บัญชี / กระเป๋าเงิน">
      <ul className="mb-3 space-y-2">
        {accounts.length === 0 && (
          <li className="text-sm text-blush-400">ยังไม่มีบัญชี</li>
        )}
        {accounts.map((a) => (
          <li
            key={a.id}
            className="flex items-center justify-between rounded-lg bg-blush-50 dark:bg-plum-800 px-3 py-2 text-sm"
          >
            <span className="text-blush-700 dark:text-blush-200">
              {a.name}{" "}
              <span className="text-xs text-blush-400">
                ({KIND_LABEL[a.kind]})
              </span>
            </span>
            <button
              onClick={() => removeAccount(a.id)}
              className="text-blush-400 hover:text-rose-500"
              aria-label="ลบ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="ชื่อบัญชี เช่น กสิกร"
          className={`${inputCls} flex-1`}
        />
        <select
          value={kind}
          onChange={(e) => setKind(e.target.value as typeof kind)}
          className={inputCls}
        >
          <option value="cash">เงินสด</option>
          <option value="bank">ธนาคาร</option>
          <option value="card">บัตร</option>
          <option value="other">อื่นๆ</option>
        </select>
        <button onClick={add} className={btnCls}>
          <Plus className="h-4 w-4" /> เพิ่ม
        </button>
      </div>
    </Card>
  );
}

function Categories() {
  const { customCats, addCategory, removeCategory } = useData();
  const { notify } = useToast();
  const [label, setLabel] = useState("");
  const [type, setType] = useState<TxType>("expense");

  const add = async () => {
    if (!label.trim()) return;
    await addCategory({ label: label.trim(), type });
    setLabel("");
    notify("เพิ่มหมวดหมู่แล้ว");
  };

  return (
    <Card icon={<Tag className="h-5 w-5" />} title="หมวดหมู่ที่กำหนดเอง">
      <ul className="mb-3 space-y-2">
        {customCats.length === 0 && (
          <li className="text-sm text-blush-400">
            ยังไม่มีหมวดที่เพิ่มเอง (มีหมวดพื้นฐานให้แล้ว)
          </li>
        )}
        {customCats.map((c) => (
          <li
            key={c.id}
            className="flex items-center justify-between rounded-lg bg-blush-50 dark:bg-plum-800 px-3 py-2 text-sm"
          >
            <span className="text-blush-700 dark:text-blush-200">
              {c.label}{" "}
              <span className="text-xs text-blush-400">
                ({c.type === "income" ? "รายรับ" : "รายจ่าย"})
              </span>
            </span>
            <button
              onClick={() => removeCategory(c.id)}
              className="text-blush-400 hover:text-rose-500"
              aria-label="ลบ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="flex flex-wrap gap-2">
        <input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="ชื่อหมวด เช่น ค่ากาแฟ"
          className={`${inputCls} flex-1`}
        />
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TxType)}
          className={inputCls}
        >
          <option value="expense">รายจ่าย</option>
          <option value="income">รายรับ</option>
        </select>
        <button onClick={add} className={btnCls}>
          <Plus className="h-4 w-4" /> เพิ่ม
        </button>
      </div>
    </Card>
  );
}

function CategoryBudgets() {
  const { categoriesForType, categoryBudgets, setCategoryBudget } = useData();
  const { notify } = useToast();
  const cats = categoriesForType("expense");

  return (
    <Card icon={<Target className="h-5 w-5" />} title="งบต่อหมวดหมู่ (ต่อเดือน)">
      <div className="space-y-2">
        {cats.map((c) => (
          <div key={c.key} className="flex items-center justify-between gap-3">
            <span className="text-sm text-blush-700 dark:text-blush-200">
              {c.label}
            </span>
            <input
              key={`${c.key}-${categoryBudgets[c.key] ?? ""}`}
              type="number"
              min="0"
              step="100"
              defaultValue={categoryBudgets[c.key] ?? ""}
              onBlur={(e) => {
                const v = parseFloat(e.target.value);
                const next = isNaN(v) || v < 0 ? 0 : v;
                if (next !== (categoryBudgets[c.key] ?? 0)) {
                  setCategoryBudget(c.key, next);
                  notify(`ตั้งงบ ${c.label} แล้ว`);
                }
              }}
              placeholder="ไม่จำกัด"
              className={`${inputCls} w-32 text-right`}
            />
          </div>
        ))}
      </div>
    </Card>
  );
}

function Recurring() {
  const { recurring, addRecurring, removeRecurring, categoriesForType } =
    useData();
  const { notify } = useToast();
  const [type, setType] = useState<TxType>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const cats = categoriesForType(type);
  const [category, setCategory] = useState(cats[0]?.key ?? "");

  const add = async () => {
    const amt = parseFloat(amount);
    const d = parseInt(day, 10);
    if (!description.trim() || isNaN(amt) || amt <= 0) return;
    await addRecurring({
      type,
      description: description.trim(),
      category: category || categoriesForType(type)[0].key,
      amount: amt,
      dayOfMonth: Math.min(Math.max(1, d || 1), 31),
    });
    setDescription("");
    setAmount("");
    notify("เพิ่มรายการประจำแล้ว");
  };

  return (
    <Card icon={<Repeat className="h-5 w-5" />} title="รายการประจำ (อัตโนมัติทุกเดือน)">
      <ul className="mb-3 space-y-2">
        {recurring.length === 0 && (
          <li className="text-sm text-blush-400">
            ยังไม่มีรายการประจำ (เช่น เงินเดือน ค่าเช่า)
          </li>
        )}
        {recurring.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between rounded-lg bg-blush-50 dark:bg-plum-800 px-3 py-2 text-sm"
          >
            <span className="text-blush-700 dark:text-blush-200">
              {r.description}{" "}
              <span className="text-xs text-blush-400">
                ({r.type === "income" ? "+" : "-"}
                {formatMoney(r.amount)} · ทุกวันที่ {r.dayOfMonth})
              </span>
            </span>
            <button
              onClick={() => removeRecurring(r.id)}
              className="text-blush-400 hover:text-rose-500"
              aria-label="ลบ"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>
      <div className="grid gap-2 sm:grid-cols-2">
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="เช่น เงินเดือน"
          className={inputCls}
        />
        <input
          type="number"
          min="0"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="จำนวนเงิน"
          className={inputCls}
        />
        <select
          value={type}
          onChange={(e) => {
            const t = e.target.value as TxType;
            setType(t);
            setCategory(categoriesForType(t)[0]?.key ?? "");
          }}
          className={inputCls}
        >
          <option value="expense">รายจ่าย</option>
          <option value="income">รายรับ</option>
        </select>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputCls}
        >
          {cats.map((c) => (
            <option key={c.key} value={c.key}>
              {c.label}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-blush-600 dark:text-blush-300">
          ทุกวันที่
          <input
            type="number"
            min="1"
            max="31"
            value={day}
            onChange={(e) => setDay(e.target.value)}
            className={`${inputCls} w-20`}
          />
        </label>
        <button onClick={add} className={`${btnCls} justify-center`}>
          <Plus className="h-4 w-4" /> เพิ่มรายการประจำ
        </button>
      </div>
    </Card>
  );
}
