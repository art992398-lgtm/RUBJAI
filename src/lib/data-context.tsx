"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  collection,
  doc,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import { useAuth } from "./auth-context";
import {
  INCOME_CATEGORIES,
  EXPENSE_CATEGORIES,
  type CategoryDef,
} from "./categories";
import type { Account, CustomCategory, RecurringRule, TxType } from "./types";

interface DataValue {
  accounts: Account[];
  customCats: CustomCategory[];
  recurring: RecurringRule[];
  categoryBudgets: Record<string, number>; // categoryKey -> monthly limit

  categoriesForType: (t: TxType) => CategoryDef[];
  labelOf: (key: string) => string;
  accountName: (id?: string) => string | null;

  addAccount: (a: Omit<Account, "id">) => Promise<void>;
  removeAccount: (id: string) => Promise<void>;
  addCategory: (c: Omit<CustomCategory, "id">) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  addRecurring: (r: Omit<RecurringRule, "id">) => Promise<void>;
  removeRecurring: (id: string) => Promise<void>;
  setCategoryBudget: (categoryKey: string, limit: number) => Promise<void>;
}

const noop = async () => {};
const DataContext = createContext<DataValue>({
  accounts: [],
  customCats: [],
  recurring: [],
  categoryBudgets: {},
  categoriesForType: (t) =>
    t === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES,
  labelOf: (k) => k,
  accountName: () => null,
  addAccount: noop,
  removeAccount: noop,
  addCategory: noop,
  removeCategory: noop,
  addRecurring: noop,
  removeRecurring: noop,
  setCategoryBudget: noop,
});

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [customCats, setCustomCats] = useState<CustomCategory[]>([]);
  const [recurring, setRecurring] = useState<RecurringRule[]>([]);
  const [categoryBudgets, setCatBudgets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) {
      setAccounts([]);
      setCustomCats([]);
      setRecurring([]);
      setCatBudgets({});
      return;
    }
    const base = (name: string) => collection(db, "users", user.uid, name);

    const u1 = onSnapshot(base("accounts"), (s) =>
      setAccounts(
        s.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Account, "id">) }))
      )
    );
    const u2 = onSnapshot(base("categories"), (s) =>
      setCustomCats(
        s.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<CustomCategory, "id">),
        }))
      )
    );
    const u3 = onSnapshot(base("recurring"), (s) =>
      setRecurring(
        s.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<RecurringRule, "id">),
        }))
      )
    );
    const u4 = onSnapshot(base("categoryBudgets"), (s) => {
      const m: Record<string, number> = {};
      s.docs.forEach((d) => {
        const l = (d.data() as { limit?: number }).limit;
        if (typeof l === "number") m[d.id] = l;
      });
      setCatBudgets(m);
    });
    return () => {
      u1();
      u2();
      u3();
      u4();
    };
  }, [user]);

  const value = useMemo<DataValue>(() => {
    const customIncome: CategoryDef[] = customCats
      .filter((c) => c.type === "income")
      .map((c) => ({ key: c.id, label: c.label, hint: c.hint ?? "" }));
    const customExpense: CategoryDef[] = customCats
      .filter((c) => c.type === "expense")
      .map((c) => ({ key: c.id, label: c.label, hint: c.hint ?? "" }));

    const income = [...INCOME_CATEGORIES, ...customIncome];
    const expense = [...EXPENSE_CATEGORIES, ...customExpense];
    const all = [...income, ...expense];

    const col = (name: string) =>
      user ? collection(db, "users", user.uid, name) : null;

    return {
      accounts,
      customCats,
      recurring,
      categoryBudgets,
      categoriesForType: (t) => (t === "income" ? income : expense),
      labelOf: (key) => all.find((c) => c.key === key)?.label ?? key,
      accountName: (id) =>
        id ? accounts.find((a) => a.id === id)?.name ?? null : null,

      addAccount: async (a) => {
        const c = col("accounts");
        if (c) await addDoc(c, a);
      },
      removeAccount: async (id) => {
        if (user) await deleteDoc(doc(db, "users", user.uid, "accounts", id));
      },
      addCategory: async (cat) => {
        const c = col("categories");
        if (c) await addDoc(c, cat);
      },
      removeCategory: async (id) => {
        if (user) await deleteDoc(doc(db, "users", user.uid, "categories", id));
      },
      addRecurring: async (r) => {
        const c = col("recurring");
        if (c) await addDoc(c, r);
      },
      removeRecurring: async (id) => {
        if (user) await deleteDoc(doc(db, "users", user.uid, "recurring", id));
      },
      setCategoryBudget: async (categoryKey, limit) => {
        if (user)
          await setDoc(
            doc(db, "users", user.uid, "categoryBudgets", categoryKey),
            { limit }
          );
      },
    };
  }, [user, accounts, customCats, recurring, categoryBudgets]);

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  return useContext(DataContext);
}

// mark a recurring rule as posted for a month
export async function markRecurringPosted(
  uid: string,
  ruleId: string,
  month: string
) {
  await updateDoc(doc(db, "users", uid, "recurring", ruleId), {
    lastMonth: month,
  });
}
