import type { NewTransaction, RecurringRule } from "./types";
import { addTransaction } from "./transactions";
import { markRecurringPosted } from "./data-context";

function currentMonthKey(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

// Post any recurring rule whose day has arrived this month and not yet posted.
// Returns number of entries created.
export async function postDueRecurring(
  uid: string,
  rules: RecurringRule[]
): Promise<number> {
  const month = currentMonthKey();
  const today = new Date();
  const dom = today.getDate();
  // last calendar day of the current month (handles 28/29/30/31)
  const lastDay = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  let posted = 0;

  for (const r of rules) {
    if (r.lastMonth === month) continue; // already posted this month
    // a rule set to e.g. day 31 posts on the last day of shorter months
    const day = Math.min(Math.max(1, r.dayOfMonth), lastDay);
    if (dom < day) continue; // not due yet

    const dateIso = `${month}-${String(day).padStart(2, "0")}`;
    const tx: NewTransaction = {
      type: r.type,
      date: dateIso,
      description: r.description,
      category: r.category,
      amount: r.amount,
      note: "รายการประจำอัตโนมัติ",
      ...(r.accountId ? { accountId: r.accountId } : {}),
    };
    await addTransaction(uid, tx);
    await markRecurringPosted(uid, r.id, month);
    posted++;
  }
  return posted;
}
