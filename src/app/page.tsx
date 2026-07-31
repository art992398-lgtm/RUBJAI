"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ToastProvider";
import { Logo } from "@/components/Logo";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ShieldCheck,
  LogIn,
  Loader2,
} from "lucide-react";

function GoogleMark() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.9 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.3-.4-3.5z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.6 6.1 29.6 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.2 34.9 26.7 36 24 36c-5.3 0-9.7-3.1-11.3-7.6l-6.5 5C9.5 39.6 16.2 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4 5.5l6.3 5.3C41.2 35.9 44 30.5 44 24c0-1.3-.1-2.3-.4-3.5z"/>
    </svg>
  );
}

export default function Home() {
  const { user, loading, loginGoogle } = useAuth();
  const router = useRouter();
  const [signingIn, setSigningIn] = useState(false);
  const { notify } = useToast();

  useEffect(() => {
    if (!loading && user) router.replace("/dashboard");
  }, [user, loading, router]);

  const handleLogin = async () => {
    setSigningIn(true);
    try {
      await loginGoogle();
    } catch (e) {
      const code =
        typeof e === "object" && e && "code" in e ? String(e.code) : "";
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") {
        // user closed popup — no alert
      } else if (code === "auth/unauthorized-domain") {
        notify("โดเมนนี้ยังไม่ได้อนุญาตใน Firebase (Authorized domains)", "error");
      } else {
        notify("เข้าสู่ระบบไม่สำเร็จ ลองใหม่อีกครั้ง", "error");
      }
    } finally {
      setSigningIn(false);
    }
  };

  if (loading || user) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blush-500" />
      </div>
    );
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col items-center justify-center gap-12 px-6 py-16 md:flex-row md:gap-20">
      {/* left hero */}
      <section className="flex-1 space-y-6 text-center md:text-left">
        <div className="flex items-center justify-center gap-3 md:justify-start">
          <Logo size={52} />
          <span className="text-3xl font-bold text-blush-700 dark:text-blush-200">Rubjai</span>
        </div>
        <h1 className="text-4xl font-bold leading-tight text-blush-700 dark:text-blush-200 md:text-5xl">
          บันทึกรายรับรายจ่าย
          <br />
          ง่าย เป็นระเบียบ ในที่เดียว
        </h1>
        <p className="mx-auto max-w-md text-lg text-blush-600 dark:text-blush-300/80 md:mx-0">
          จดทุกบาททุกสตางค์ แยกหมวดรายรับรายจ่าย เห็นยอดคงเหลือแบบเรียลไทม์
          ข้อมูลของคุณเป็นของคุณคนเดียว
        </p>

        <div className="grid max-w-md gap-3 sm:grid-cols-3">
          <Feature icon={<TrendingUp className="h-5 w-5" />} label="รายรับ" />
          <Feature icon={<TrendingDown className="h-5 w-5" />} label="รายจ่าย" />
          <Feature icon={<Wallet className="h-5 w-5" />} label="ยอดคงเหลือ" />
        </div>
      </section>

      {/* right login card */}
      <section className="w-full max-w-sm">
        <div className="animate-scale rounded-3xl border border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 p-8 shadow-soft backdrop-blur">
          <h2 className="text-center text-xl font-semibold text-blush-700 dark:text-blush-200">
            เข้าสู่ระบบ
          </h2>
          <p className="mt-1 text-center text-sm text-blush-500">
            ใช้บัญชี Google ของคุณ
          </p>

          <button
            onClick={handleLogin}
            disabled={signingIn}
            className="mt-6 flex w-full items-center justify-center gap-3 rounded-xl border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-4 py-3 font-medium text-blush-700 dark:text-blush-200 shadow-sm transition hover:-translate-y-0.5 hover:border-blush-300 hover:shadow-md disabled:opacity-60 disabled:hover:translate-y-0"
          >
            {signingIn ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <GoogleMark />
            )}
            <span>{signingIn ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบด้วย Google"}</span>
            {!signingIn && <LogIn className="h-4 w-4 opacity-60" />}
          </button>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-blush-500">
            <ShieldCheck className="h-4 w-4" />
            <span>ข้อมูลแยกตามผู้ใช้ ปลอดภัยด้วย Firebase</span>
          </div>
        </div>
      </section>
    </main>
  );
}

function Feature({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-2 rounded-xl border border-blush-100 dark:border-plum-800 bg-white/70 dark:bg-plum-900/50 px-3 py-2 text-sm font-medium text-blush-700 dark:text-blush-200">
      <span className="text-blush-500">{icon}</span>
      {label}
    </div>
  );
}
