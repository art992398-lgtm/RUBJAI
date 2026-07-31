"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useSettings } from "@/lib/settings-context";
import { Logo } from "./Logo";
import {
  LogOut,
  LayoutDashboard,
  CalendarRange,
  PiggyBank,
  Receipt,
  CreditCard,
  Settings,
  Moon,
  Sun,
} from "lucide-react";

const TABS = [
  { href: "/dashboard", label: "รายการ", icon: LayoutDashboard },
  { href: "/budget", label: "งบ", icon: CalendarRange },
  { href: "/savings", label: "ออม", icon: PiggyBank },
  { href: "/debt", label: "หนี้", icon: CreditCard },
  { href: "/tax", label: "ภาษี", icon: Receipt },
  { href: "/settings", label: "ตั้งค่า", icon: Settings },
];

export function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme, displayName } = useSettings();
  const pathname = usePathname();
  const shownName = displayName || user?.displayName || "ผู้ใช้";

  return (
    <>
      <header className="sticky top-0 z-20 border-b border-blush-100 dark:border-plum-800 bg-white/80 dark:bg-plum-900/60 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Logo size={34} />
            <span className="text-lg font-bold text-blush-700 dark:text-blush-200">
              Rubjai
            </span>
            <nav className="ml-4 hidden items-center gap-1 sm:flex">
              {TABS.map((t) => {
                const active = pathname === t.href;
                const Icon = t.icon;
                return (
                  <Link
                    key={t.href}
                    href={t.href}
                    className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition-colors ${
                      active
                        ? "bg-blush-500 text-white shadow-sm"
                        : "text-blush-600 dark:text-blush-300 hover:bg-blush-50 dark:hover:bg-plum-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{t.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              aria-label="สลับธีม"
              className="rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 p-1.5 text-blush-600 dark:text-blush-300 hover:bg-blush-50 dark:hover:bg-plum-700"
            >
              {theme === "dark" ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
            {user?.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt={shownName}
                className="h-8 w-8 rounded-full border border-blush-200 dark:border-plum-800"
                referrerPolicy="no-referrer"
              />
            ) : null}
            <span className="hidden max-w-[10rem] truncate text-sm font-medium text-blush-700 dark:text-blush-200 sm:inline">
              {shownName}
            </span>
            <button
              onClick={() => logout()}
              className="flex items-center gap-1.5 rounded-lg border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 px-2.5 py-1.5 text-sm font-medium text-blush-700 dark:text-blush-200 hover:bg-blush-50 dark:hover:bg-plum-700"
            >
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">ออกจากระบบ</span>
            </button>
          </div>
        </div>
      </header>

      {/* mobile bottom nav */}
      <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-blush-100 dark:border-plum-800 bg-white/90 dark:bg-plum-900/80 pb-[env(safe-area-inset-bottom)] backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-md">
          {TABS.map((t) => {
            const active = pathname === t.href;
            const Icon = t.icon;
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium transition-colors ${
                  active ? "text-blush-600 dark:text-blush-300" : "text-blush-400"
                }`}
              >
                <span
                  className={`flex h-7 w-12 items-center justify-center rounded-full transition-all ${
                    active
                      ? "bg-blush-100 dark:bg-plum-800 text-blush-600 dark:text-blush-300"
                      : "text-blush-400"
                  }`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                {t.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
