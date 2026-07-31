import type { Transaction } from "./types";

// For categories with their own monthly budget, spending inside the limit
// is "covered" by that budget and excluded from the weekly budget. Anything
// beyond the limit spills back into the weekly budget instead of just
// disappearing. Returns, per transaction id, how much of that transaction
// counts as overage (0 if fully covered or category has no budget).
export function categoryOverageByRow(
  rows: Transaction[],
  categoryBudgets: Record<string, number>
): Map<string, number> {
  const groups: Record<string, Transaction[]> = {};
  for (const r of rows) {
    if (r.type !== "expense") continue;
    const limit = categoryBudgets[r.category];
    if (!(limit > 0)) continue;
    const key = `${r.category}|${r.date.slice(0, 7)}`;
    (groups[key] ??= []).push(r);
  }

  const result = new Map<string, number>();
  for (const key in groups) {
    const category = key.slice(0, key.indexOf("|"));
    const limit = categoryBudgets[category];
    const sorted = [...groups[key]].sort((a, b) => {
      if (a.date !== b.date) return a.date < b.date ? -1 : 1;
      return (a.createdAt ?? 0) - (b.createdAt ?? 0);
    });
    let running = 0;
    for (const r of sorted) {
      const before = running;
      running += r.amount;
      const overage = Math.max(0, running - limit) - Math.max(0, before - limit);
      if (overage > 0) result.set(r.id, overage);
    }
  }
  return result;
}
