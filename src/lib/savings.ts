import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
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
