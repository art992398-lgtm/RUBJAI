"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import { setCurrentCurrency } from "./format";

type Theme = "light" | "dark";

interface Settings {
  currency: string;
  theme: Theme;
}

interface SettingsValue extends Settings {
  setCurrency: (c: string) => void;
  toggleTheme: () => void;
}

const DEFAULTS: Settings = { currency: "THB", theme: "light" };

const SettingsContext = createContext<SettingsValue>({
  ...DEFAULTS,
  setCurrency: () => {},
  toggleTheme: () => {},
});

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<Settings>(DEFAULTS);

  // subscribe to profile doc
  useEffect(() => {
    if (!user) {
      setSettings(DEFAULTS);
      return;
    }
    const ref = doc(db, "users", user.uid);
    return onSnapshot(ref, (snap) => {
      const data = snap.data() as Partial<Settings> | undefined;
      setSettings({
        currency: data?.currency ?? DEFAULTS.currency,
        theme: data?.theme ?? DEFAULTS.theme,
      });
    });
  }, [user]);

  // apply side effects
  useEffect(() => {
    setCurrentCurrency(settings.currency);
    const root = document.documentElement;
    if (settings.theme === "dark") root.classList.add("dark");
    else root.classList.remove("dark");
  }, [settings.currency, settings.theme]);

  const persist = async (patch: Partial<Settings>) => {
    setSettings((s) => ({ ...s, ...patch })); // optimistic
    if (user) {
      await setDoc(doc(db, "users", user.uid), patch, { merge: true });
    }
  };

  return (
    <SettingsContext.Provider
      value={{
        ...settings,
        setCurrency: (c) => persist({ currency: c }),
        toggleTheme: () =>
          persist({ theme: settings.theme === "dark" ? "light" : "dark" }),
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
