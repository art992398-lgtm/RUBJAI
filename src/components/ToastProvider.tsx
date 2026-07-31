"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from "react";
import { CheckCircle2, AlertTriangle, Info, X } from "lucide-react";

type ToastKind = "success" | "error" | "info";

interface Toast {
  id: number;
  kind: ToastKind;
  message: string;
}

interface ToastValue {
  notify: (message: string, kind?: ToastKind) => void;
}

const ToastContext = createContext<ToastValue>({ notify: () => {} });

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const remove = useCallback((id: number) => {
    setToasts((t) => t.filter((x) => x.id !== id));
  }, []);

  const notify = useCallback(
    (message: string, kind: ToastKind = "success") => {
      const id = ++seq;
      setToasts((t) => [...t, { id, kind, message }]);
      setTimeout(() => remove(id), 3200);
    },
    [remove]
  );

  return (
    <ToastContext.Provider value={{ notify }}>
      {children}

      <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-center gap-2 p-4 sm:inset-x-auto sm:right-4 sm:items-end">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onClose={() => remove(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const styles: Record<ToastKind, { icon: ReactNode; ring: string }> = {
    success: {
      icon: <CheckCircle2 className="h-5 w-5 text-emerald-500" />,
      ring: "border-emerald-100",
    },
    error: {
      icon: <AlertTriangle className="h-5 w-5 text-rose-500" />,
      ring: "border-rose-100",
    },
    info: {
      icon: <Info className="h-5 w-5 text-blush-500" />,
      ring: "border-blush-100 dark:border-plum-800",
    },
  };
  const s = styles[toast.kind];

  return (
    <div
      className={`pointer-events-auto flex w-full max-w-sm animate-toast items-center gap-3 rounded-2xl border ${s.ring} bg-white/95 dark:bg-plum-900/90 px-4 py-3 shadow-soft backdrop-blur`}
    >
      {s.icon}
      <p className="flex-1 text-sm font-medium text-blush-700 dark:text-blush-200">
        {toast.message}
      </p>
      <button
        onClick={onClose}
        aria-label="ปิด"
        className="rounded-full p-1 text-blush-300 hover:bg-blush-50 dark:bg-plum-800 hover:text-blush-500"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}

export function useToast() {
  return useContext(ToastContext);
}
