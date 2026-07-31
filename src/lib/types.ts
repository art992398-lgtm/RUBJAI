export type TxType = "income" | "expense";

export interface Transaction {
  id: string;
  date: string; // ISO yyyy-mm-dd
  description: string;
  type: TxType;
  category: string;
  amount: number;
  note?: string;
  accountId?: string; // wallet
  receiptUrl?: string; // uploaded slip
  createdAt?: number;
}

export interface Account {
  id: string;
  name: string;
  kind: "cash" | "bank" | "card" | "other";
}

export interface CustomCategory {
  id: string;
  label: string;
  type: TxType;
  hint?: string;
}

export interface RecurringRule {
  id: string;
  type: TxType;
  description: string;
  category: string;
  amount: number;
  dayOfMonth: number; // 1-28
  accountId?: string;
  lastMonth?: string; // "YYYY-MM" last time posted
}

export type NewTransaction = Omit<Transaction, "id" | "createdAt">;
