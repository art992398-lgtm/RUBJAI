"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Lock, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { hashPin, isUnlockedThisSession, markUnlocked } from "@/lib/pin";
import { Logo } from "./Logo";

export function PinGate({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pinHash } = useSettings();
  const [unlocked, setUnlocked] = useState(false);
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [checking, setChecking] = useState(false);

  useEffect(() => {
    setUnlocked(isUnlockedThisSession());
  }, [pinHash]);

  const locked = !!user && !!pinHash && !unlocked;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setChecking(true);
    setError(false);
    const h = await hashPin(pin);
    if (h === pinHash) {
      markUnlocked();
      setUnlocked(true);
    } else {
      setError(true);
      setPin("");
    }
    setChecking(false);
  };

  if (!locked) return <>{children}</>;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
      <Logo size={48} />
      <form onSubmit={submit} className="w-full max-w-xs space-y-3 text-center">
        <div className="flex items-center justify-center gap-2 text-blush-700 dark:text-blush-200">
          <Lock className="h-5 w-5" />
          <h1 className="text-lg font-bold">ใส่ PIN เพื่อเข้าใช้งาน</h1>
        </div>
        <input
          type="password"
          inputMode="numeric"
          autoFocus
          value={pin}
          onChange={(e) => {
            setPin(e.target.value);
            setError(false);
          }}
          maxLength={8}
          className="w-full rounded-xl border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-4 py-3 text-center text-2xl tracking-[0.4em] outline-none focus:border-blush-500"
        />
        {error && <p className="text-sm text-rose-500">PIN ไม่ถูกต้อง</p>}
        <button
          type="submit"
          disabled={checking || !pin}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blush-500 px-4 py-2.5 font-semibold text-white shadow-soft transition hover:bg-blush-600 disabled:opacity-60"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" /> : "ปลดล็อก"}
        </button>
      </form>
    </div>
  );
}
