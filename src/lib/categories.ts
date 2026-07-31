import type { TxType } from "./types";

export interface CategoryDef {
  key: string;
  label: string;
  hint: string;
}

export const INCOME_CATEGORIES: CategoryDef[] = [
  { key: "salary", label: "รายได้ประจำ", hint: "เงินเดือน โบนัส ค่าจ้างรายวัน" },
  { key: "side", label: "รายได้เสริม", hint: "ค่าคอมมิชชัน ค่านายหน้า ยอดขายสินค้า" },
  { key: "invest", label: "รายได้จากการลงทุน", hint: "ดอกเบี้ยธนาคาร เงินปันผล" },
];

export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { key: "fixed", label: "รายจ่ายคงที่", hint: "ค่าเช่าบ้าน ค่าผ่อนรถ" },
  { key: "variable", label: "รายจ่ายผันแปร", hint: "ค่าอาหาร ค่าเดินทาง" },
  { key: "saving", label: "รายจ่ายเพื่อการออม", hint: "เงินออมสะสม เงินลงทุน" },
];

export function categoriesFor(type: TxType): CategoryDef[] {
  return type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
}

export function categoryLabel(key: string): string {
  const all = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];
  return all.find((c) => c.key === key)?.label ?? key;
}
