"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** bottom-sheet style on mobile */
  sheetOnMobile?: boolean;
}

export function Modal({
  open,
  onClose,
  title,
  children,
  sheetOnMobile = true,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      role="dialog"
      aria-modal="true"
    >
      {/* backdrop */}
      <button
        aria-label="ปิด"
        onClick={onClose}
        className="absolute inset-0 animate-fade bg-blush-900/30 backdrop-blur-sm"
      />

      {/* panel */}
      <div
        className={`relative z-10 w-full bg-white dark:bg-plum-800 shadow-soft sm:max-w-md ${
          sheetOnMobile
            ? "animate-sheet rounded-t-3xl sm:animate-scale sm:rounded-3xl"
            : "m-4 animate-scale rounded-3xl"
        }`}
      >
        {/* mobile grabber */}
        {sheetOnMobile && (
          <div className="flex justify-center pt-3 sm:hidden">
            <span className="h-1.5 w-10 rounded-full bg-blush-200" />
          </div>
        )}

        <div className="flex items-center justify-between px-6 pb-2 pt-4">
          <h2 className="text-lg font-bold text-blush-700 dark:text-blush-200">{title}</h2>
          <button
            onClick={onClose}
            aria-label="ปิด"
            className="rounded-full p-1.5 text-blush-400 hover:bg-blush-50 dark:bg-plum-800 hover:text-blush-600 dark:text-blush-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-[80vh] overflow-y-auto px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>
  );
}
