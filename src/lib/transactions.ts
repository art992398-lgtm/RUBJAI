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
import type { NewTransaction, Transaction } from "./types";

// Per-user isolation: users/{uid}/transactions/{id}
function txCol(uid: string) {
  return collection(db, "users", uid, "transactions");
}

export function subscribeTransactions(
  uid: string,
  cb: (rows: Transaction[]) => void
) {
  // single-field order avoids composite index; UI re-sorts by date for balance
  const q = query(txCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    const rows: Transaction[] = snap.docs.map((d) => ({
      id: d.id,
      ...(d.data() as Omit<Transaction, "id">),
    }));
    cb(rows);
  });
}

export async function addTransaction(uid: string, tx: NewTransaction) {
  return addDoc(txCol(uid), { ...tx, createdAt: Date.now() });
}

export async function updateTransaction(
  uid: string,
  id: string,
  patch: Partial<NewTransaction>
) {
  return updateDoc(doc(db, "users", uid, "transactions", id), patch);
}

export async function removeTransaction(uid: string, id: string) {
  return deleteDoc(doc(db, "users", uid, "transactions", id));
}
