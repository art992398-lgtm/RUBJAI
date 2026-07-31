"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "./Modal";

interface Props {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  danger = true,
  onConfirm,
  onClose,
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title} sheetOnMobile>
      <div className="flex items-start gap-3">
        <span
          className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
            danger ? "bg-rose-50 text-rose-500" : "bg-blush-50 dark:bg-plum-800 text-blush-500"
          }`}
        >
          <AlertTriangle className="h-5 w-5" />
        </span>
        <p className="text-sm text-blush-700 dark:text-blush-200">{message}</p>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <button
          onClick={onClose}
          className="rounded-xl border border-blush-200 dark:border-plum-800 bg-white dark:bg-plum-800 py-2.5 font-medium text-blush-600 dark:text-blush-300 hover:bg-blush-50 dark:bg-plum-800"
        >
          {cancelLabel}
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`rounded-xl py-2.5 font-semibold text-white shadow-soft ${
            danger
              ? "bg-rose-500 hover:bg-rose-600"
              : "bg-blush-500 hover:bg-blush-600"
          }`}
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
