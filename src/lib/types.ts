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

export interface Saving {
  id: string;
  amount: number;
  type: "in" | "out"; // in = เก็บเข้าออม, out = ถอน
  date: string; // ISO yyyy-mm-dd
  note?: string;
  month?: string; // "YYYY-MM" when this came from a month's leftover
  createdAt?: number;
}

export interface Transfer {
  id: string;
  date: string; // ISO yyyy-mm-dd
  fromAccountId: string;
  toAccountId: string;
  amount: number;
  note?: string;
  createdAt?: number;
}

export interface Debt {
  id: string;
  name: string;
  principal: number; // total borrowed / installment price
  remaining: number; // balance left to pay
  monthlyPayment: number;
  nextDueDate: string; // ISO yyyy-mm-dd
  note?: string;
  createdAt?: number;
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
