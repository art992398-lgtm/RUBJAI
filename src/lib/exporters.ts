import type { Transaction } from "./types";
import { formatDateThai } from "./format";

function csvCell(v: string | number): string {
  const s = String(v ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function exportTransactionsCsv(
  rows: Transaction[],
  labelOf: (k: string) => string,
  accountName: (id?: string) => string | null,
  filename = "rubjai-transactions.csv"
) {
  const header = [
    "วันที่",
    "รายการ",
    "ประเภท",
    "หมวดหมู่",
    "รายรับ",
    "รายจ่าย",
    "บัญชี",
    "หมายเหตุ",
  ];
  const lines = [header.map(csvCell).join(",")];

  // oldest first for readability
  const sorted = [...rows].sort((a, b) => (a.date < b.date ? -1 : 1));
  for (const r of sorted) {
    lines.push(
      [
        formatDateThai(r.date),
        r.description,
        r.type === "income" ? "รายรับ" : "รายจ่าย",
        labelOf(r.category),
        r.type === "income" ? r.amount : "",
        r.type === "expense" ? r.amount : "",
        accountName(r.accountId) ?? "",
        r.note ?? "",
      ]
        .map(csvCell)
        .join(",")
    );
  }

  // BOM so Excel reads Thai UTF-8
  const blob = new Blob(["﻿" + lines.join("\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
