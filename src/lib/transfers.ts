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
import type { Transfer } from "./types";

// users/{uid}/transfers/{id} — moves money between accounts, not counted as income/expense
function transfersCol(uid: string) {
  return collection(db, "users", uid, "transfers");
}

export function subscribeTransfers(uid: string, cb: (rows: Transfer[]) => void) {
  const q = query(transfersCol(uid), orderBy("createdAt", "desc"));
  return onSnapshot(q, (snap) => {
    cb(
      snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Transfer, "id">) }))
    );
  });
}

export async function addTransfer(uid: string, t: Omit<Transfer, "id" | "createdAt">) {
  return addDoc(transfersCol(uid), { ...t, createdAt: Date.now() });
}

export async function removeTransfer(uid: string, id: string) {
  return deleteDoc(doc(db, "users", uid, "transfers", id));
}
