import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Debt } from "./types";

// users/{uid}/debts/{id}
function debtsCol(uid: string) {
  return collection(db, "users", uid, "debts");
}

export function subscribeDebts(uid: string, cb: (rows: Debt[]) => void) {
  const q = query(debtsCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Debt, "id">) })));
  });
}

export async function addDebt(uid: string, d: Omit<Debt, "id" | "createdAt">) {
  return addDoc(debtsCol(uid), { ...d, createdAt: Date.now() });
}

export async function removeDebt(uid: string, id: string) {
  return deleteDoc(doc(db, "users", uid, "debts", id));
}

// pay one installment: reduce remaining, roll next due date forward a month
export async function payInstallment(
  uid: string,
  debt: Debt,
  amount: number
) {
  const remaining = Math.max(0, debt.remaining - amount);
  const [y, m, d] = debt.nextDueDate.split("-").map(Number);
  const next = new Date(y, m - 1, d);
  next.setMonth(next.getMonth() + 1);
  const nextDueDate = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}-${String(next.getDate()).padStart(2, "0")}`;
  return updateDoc(doc(db, "users", uid, "debts", debt.id), {
    remaining,
    nextDueDate,
  });
}
