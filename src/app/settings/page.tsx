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
  User,
  Lock,
  Download,
  Upload,
  Bell,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { useData } from "@/lib/data-context";
import { useToast } from "@/components/ToastProvider";
import { Navbar } from "@/components/Navbar";
import { ConfirmDialog } from "@/components/ConfirmDialog";
import { CURRENCIES, formatMoney } from "@/lib/format";
import { hashPin } from "@/lib/pin";
import {
  exportBackup,
  downloadBackup,
  importBackup,
  type BackupPayload,
} from "@/lib/backup";
import {
  notifyPermission,
  requestNotifyPermission,
} from "@/lib/notify";
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
        <Profile />
        <PinLock />
        <BackupRestore />
        <NotificationSettings />
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

function Profile() {
  const { user } = useAuth();
  const { displayName, setDisplayName } = useSettings();
  const { notify } = useToast();
  const [draft, setDraft] = useState(displayName || user?.displayName || "");

  useEffect(() => {
    setDraft(displayName || user?.displayName || "");
  }, [displayName, user?.displayName]);

  const save = () => {
    const next = draft.trim();
    if (!next || next === (displayName || user?.displayName)) return;
    setDisplayName(next);
    notify("บันทึกชื่อที่แสดงแล้ว");
  };

  return (
    <Card icon={<User className="h-5 w-5" />} title="โปรไฟล์">
      <div className="flex flex-wrap items-center gap-3">
        {user?.photoURL && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.photoURL}
            alt={draft}
            className="h-12 w-12 rounded-full border border-blush-200 dark:border-plum-800"
            referrerPolicy="no-referrer"
          />
        )}
        <div className="flex flex-1 flex-wrap gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="ชื่อที่แสดง"
            className={`${inputCls} flex-1`}
          />
          <button onClick={save} className={btnCls}>
            บันทึก
          </button>
        </div>
      </div>
      <p className="mt-2 text-xs text-blush-400">
        อีเมล: {user?.email ?? "-"}
      </p>
    </Card>
  );
}

function PinLock() {
  const { pinHash, setPinHash } = useSettings();
  const { notify } = useToast();
  const [pin, setPinInput] = useState("");
  const [confirm, setConfirm] = useState("");

  const save = async () => {
    if (pin.length < 4) {
      notify("PIN ต้องมีอย่างน้อย 4 หลัก", "error");
      return;
    }
    if (pin !== confirm) {
      notify("PIN ทั้งสองช่องไม่ตรงกัน", "error");
      return;
    }
    setPinHash(await hashPin(pin));
    setPinInput("");
    setConfirm("");
    notify("ตั้ง PIN แล้ว");
  };

  const remove = () => {
    setPinHash("");
    notify("ปิดล็อก PIN แล้ว", "info");
  };

  return (
    <Card icon={<Lock className="h-5 w-5" />} title="ล็อกด้วย PIN">
      {pinHash ? (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-blush-600 dark:text-blush-300">
            ตั้ง PIN ไว้แล้ว — ต้องใส่รหัสทุกครั้งที่เปิดแอปใหม่
          </span>
          <button
            onClick={remove}
            className="rounded-lg border border-rose-200 px-3 py-1.5 text-sm font-medium text-rose-500 hover:bg-rose-50"
          >
            ปิด PIN
          </button>
        </div>
      ) : (
        <p className="mb-3 text-sm text-blush-400">
          ยังไม่ได้ตั้ง PIN — ตั้งไว้กันคนอื่นเปิดแอปดูข้อมูลการเงิน
        </p>
      )}
      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={pin}
          onChange={(e) => setPinInput(e.target.value)}
          placeholder="PIN ใหม่ (4+ หลัก)"
          className={inputCls}
        />
        <input
          type="password"
          inputMode="numeric"
          maxLength={8}
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="ยืนยัน PIN"
          className={inputCls}
        />
        <button onClick={save} className={btnCls}>
          {pinHash ? "เปลี่ยน PIN" : "ตั้ง PIN"}
        </button>
      </div>
    </Card>
  );
}

function BackupRestore() {
  const { user } = useAuth();
  const { notify } = useToast();
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<BackupPayload | null>(null);

  const doExport = async () => {
    if (!user) return;
    setBusy(true);
    try {
      const payload = await exportBackup(user.uid);
      downloadBackup(payload);
      notify("ดาวน์โหลดไฟล์สำรองข้อมูลแล้ว");
    } catch {
      notify("สำรองข้อมูลไม่สำเร็จ", "error");
    } finally {
      setBusy(false);
    }
  };

  const pickFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text) as BackupPayload;
      if (!data || typeof data !== "object" || !("version" in data)) {
        notify("ไฟล์นี้ไม่ใช่ไฟล์สำรองข้อมูลของ Rubjai", "error");
        return;
      }
      setPending(data);
    } catch {
      notify("อ่านไฟล์ไม่สำเร็จ ตรวจสอบว่าเป็นไฟล์ JSON ที่ถูกต้อง", "error");
    }
  };

  const doImport = async () => {
    if (!user || !pending) return;
    setBusy(true);
    try {
      await importBackup(user.uid, pending);
      notify("นำเข้าข้อมูลสำเร็จ");
    } catch {
      notify("นำเข้าข้อมูลไม่สำเร็จ", "error");
    } finally {
      setBusy(false);
      setPending(null);
    }
  };

  return (
    <Card icon={<Download className="h-5 w-5" />} title="สำรอง / กู้คืนข้อมูล (JSON)">
      <p className="mb-3 text-sm text-blush-400">
        ดาวน์โหลดข้อมูลทั้งหมดเก็บไว้ หรือย้ายไปเครื่องใหม่ได้
      </p>
      <div className="flex flex-wrap gap-2">
        <button onClick={doExport} disabled={busy} className={btnCls}>
          <Download className="h-4 w-4" /> ดาวน์โหลดข้อมูล
        </button>
        <label className={`${btnCls} cursor-pointer bg-white dark:bg-plum-800 text-blush-700 dark:text-blush-200 border border-blush-200 dark:border-plum-800`}>
          <Upload className="h-4 w-4" /> นำเข้าไฟล์
          <input
            type="file"
            accept="application/json"
            onChange={pickFile}
            disabled={busy}
            className="hidden"
          />
        </label>
      </div>

      <ConfirmDialog
        open={!!pending}
        title="นำเข้าข้อมูล"
        message="จะเพิ่มข้อมูลทั้งหมดจากไฟล์เข้าไปในบัญชีนี้ (ไม่ลบของเดิม) ต้องการดำเนินการต่อหรือไม่?"
        confirmLabel="นำเข้า"
        danger={false}
        onConfirm={doImport}
        onClose={() => setPending(null)}
      />
    </Card>
  );
}

function NotificationSettings() {
  const { notify } = useToast();
  const [perm, setPerm] = useState<NotificationPermission | "unsupported">(
    "default"
  );

  useEffect(() => {
    setPerm(notifyPermission());
  }, []);

  const enable = async () => {
    const p = await requestNotifyPermission();
    setPerm(p);
    if (p === "granted") notify("เปิดแจ้งเตือนแล้ว");
    else if (p === "denied") notify("ไม่ได้รับอนุญาตแจ้งเตือน", "error");
  };

  return (
    <Card icon={<Bell className="h-5 w-5" />} title="แจ้งเตือน">
      <p className="mb-3 text-sm text-blush-400">
        เตือนงบสัปดาห์ใกล้หมด และหนี้ใกล้ครบกำหนด — ทำงานเฉพาะตอนเปิดแอปอยู่เท่านั้น
      </p>
      {perm === "unsupported" ? (
        <p className="text-sm text-blush-400">เบราว์เซอร์นี้ไม่รองรับการแจ้งเตือน</p>
      ) : perm === "granted" ? (
        <span className="text-sm font-medium text-emerald-600">
          เปิดแจ้งเตือนอยู่
        </span>
      ) : perm === "denied" ? (
        <span className="text-sm text-rose-500">
          ถูกบล็อกแจ้งเตือน — ไปเปิดเองในตั้งค่าเบราว์เซอร์
        </span>
      ) : (
        <button onClick={enable} className={btnCls}>
          <Bell className="h-4 w-4" /> เปิดแจ้งเตือน
        </button>
      )}
    </Card>
  );
}

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
  const { recurring, addRecurring, removeRecurring, categoriesForType, accounts, accountName } =
    useData();
  const { notify } = useToast();
  const [type, setType] = useState<TxType>("expense");
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [accountId, setAccountId] = useState("");
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
      ...(accountId ? { accountId } : {}),
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
                {formatMoney(r.amount)} · ทุกวันที่ {r.dayOfMonth}
                {accountName(r.accountId) ? ` · ${accountName(r.accountId)}` : ""})
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
        {accounts.length > 0 && (
          <select
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
            className={inputCls}
          >
            <option value="">— ไม่ระบุบัญชี —</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        )}
        <button onClick={add} className={`${btnCls} justify-center sm:col-span-2`}>
          <Plus className="h-4 w-4" /> เพิ่มรายการประจำ
        </button>
      </div>
    </Card>
  );
}
