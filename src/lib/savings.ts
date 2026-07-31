import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Saving } from "./types";

// users/{uid}/savings/{id}
function savingsCol(uid: string) {
  return collection(db, "users", uid, "savings");
}

export function subscribeSavings(uid: string, cb: (rows: Saving[]) => void) {
  const q = query(savingsCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Saving, "id">) }))
    );
  });
}

export async function addSaving(uid: string, s: Omit<Saving, "id" | "createdAt">) {
  return addDoc(savingsCol(uid), { ...s, createdAt: Date.now() });
}

export async function removeSaving(uid: string, id: string) {
  return deleteDoc(doc(db, "users", uid, "savings", id));
}

// savings goal is a single number on the user's profile doc
export function subscribeSavingsGoal(uid: string, cb: (goal: number) => void) {
  return onSnapshot(doc(db, "users", uid), (snap) => {
    const g = (snap.data() as { savingsGoal?: number } | undefined)?.savingsGoal;
    cb(typeof g === "number" ? g : 0);
  });
}

export async function setSavingsGoal(uid: string, goal: number) {
  return setDoc(doc(db, "users", uid), { savingsGoal: goal }, { merge: true });
}
