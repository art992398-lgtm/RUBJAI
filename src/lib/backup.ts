import {
  collection,
  getDocs,
  getDoc,
  doc,
  addDoc,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type {
  Transaction,
  Account,
  CustomCategory,
  RecurringRule,
  Saving,
  Transfer,
  Debt,
} from "./types";

export interface BackupPayload {
  version: 1;
  exportedAt: string;
  profile: {
    currency?: string;
    theme?: string;
    displayName?: string;
    savingsGoal?: number;
  };
  transactions: Transaction[];
  accounts: Account[];
  categories: CustomCategory[];
  recurring: RecurringRule[];
  categoryBudgets: Record<string, number>;
  savings: Saving[];
  transfers: Transfer[];
  budgets: Record<string, number>;
  debts: Debt[];
}

async function dumpCollection<T>(uid: string, name: string): Promise<T[]> {
  const snap = await getDocs(collection(db, "users", uid, name));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as T[];
}

async function dumpMap(
  uid: string,
  name: string,
  field: string
): Promise<Record<string, number>> {
  const snap = await getDocs(collection(db, "users", uid, name));
  const m: Record<string, number> = {};
  snap.docs.forEach((d) => {
    const v = (d.data() as Record<string, unknown>)[field];
    if (typeof v === "number") m[d.id] = v;
  });
  return m;
}

export async function exportBackup(uid: string): Promise<BackupPayload> {
  const profileSnap = await getDoc(doc(db, "users", uid));
  const profile = (profileSnap.data() ?? {}) as BackupPayload["profile"];

  const [
    transactions,
    accounts,
    categories,
    recurring,
    savings,
    transfers,
    debts,
    categoryBudgets,
    budgets,
  ] = await Promise.all([
    dumpCollection<Transaction>(uid, "transactions"),
    dumpCollection<Account>(uid, "accounts"),
    dumpCollection<CustomCategory>(uid, "categories"),
    dumpCollection<RecurringRule>(uid, "recurring"),
    dumpCollection<Saving>(uid, "savings"),
    dumpCollection<Transfer>(uid, "transfers"),
    dumpCollection<Debt>(uid, "debts"),
    dumpMap(uid, "categoryBudgets", "limit"),
    dumpMap(uid, "budgets", "limit"),
  ]);

  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profile: {
      currency: profile.currency,
      theme: profile.theme,
      displayName: profile.displayName,
      savingsGoal: profile.savingsGoal,
    },
    transactions,
    accounts,
    categories,
    recurring,
    categoryBudgets,
    savings,
    transfers,
    budgets,
    debts,
  };
}

export function downloadBackup(payload: BackupPayload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `rubjai-backup-${payload.exportedAt.slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

async function restoreRows<T extends { id?: string }>(
  uid: string,
  name: string,
  rows: T[] | undefined
) {
  if (!rows?.length) return;
  await Promise.all(
    rows.map((r) => {
      const { id: _id, ...rest } = r;
      return addDoc(collection(db, "users", uid, name), rest);
    })
  );
}

async function restoreMap(
  uid: string,
  name: string,
  field: string,
  m: Record<string, number> | undefined
) {
  if (!m) return;
  await Promise.all(
    Object.entries(m).map(([id, v]) =>
      setDoc(doc(db, "users", uid, name, id), { [field]: v })
    )
  );
}

export async function importBackup(uid: string, payload: BackupPayload) {
  await Promise.all([
    restoreRows(uid, "transactions", payload.transactions),
    restoreRows(uid, "accounts", payload.accounts),
    restoreRows(uid, "categories", payload.categories),
    restoreRows(uid, "recurring", payload.recurring),
    restoreRows(uid, "savings", payload.savings),
    restoreRows(uid, "transfers", payload.transfers),
    restoreRows(uid, "debts", payload.debts),
    restoreMap(uid, "categoryBudgets", "limit", payload.categoryBudgets),
    restoreMap(uid, "budgets", "limit", payload.budgets),
  ]);
  if (payload.profile) {
    await setDoc(doc(db, "users", uid), payload.profile, { merge: true });
  }
}
