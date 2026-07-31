import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "./firebase";

// users/{uid}/budgets/{weekKey}  -> { limit: number }
function budgetCol(uid: string) {
  return collection(db, "users", uid, "budgets");
}

export type BudgetMap = Record<string, number>; // weekKey -> limit

export function subscribeBudgets(uid: string, cb: (m: BudgetMap) => void) {
  return onSnapshot(budgetCol(uid), (snap) => {
    const m: BudgetMap = {};
    snap.docs.forEach((d) => {
      const limit = (d.data() as { limit?: number }).limit;
      if (typeof limit === "number") m[d.id] = limit;
    });
    cb(m);
  });
}

export async function setBudget(uid: string, weekKey: string, limit: number) {
  return setDoc(doc(db, "users", uid, "budgets", weekKey), {
    limit,
    updatedAt: Date.now(),
  });
}

export async function removeBudget(uid: string, weekKey: string) {
  return deleteDoc(doc(db, "users", uid, "budgets", weekKey));
}
