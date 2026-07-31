// Week = 7-day block anchored to day 1 of month (1-7, 8-14, 15-21, 22-28, 29-end).
// Week key = block start date (YYYY-MM-DD).

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export interface WeekInfo {
  key: string; // block start YYYY-MM-DD
  index: number; // 1-based within month
  start: string; // block start YYYY-MM-DD
  end: string; // block end YYYY-MM-DD
  label: string; // "สัปดาห์ที่ 1"
  range: string; // "1 ส.ค. – 7 ส.ค."
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function toIso(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function fromIso(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

function shortDay(d: Date): string {
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`;
}

// 7-day blocks starting day 1 of the month; last block is whatever's left
// (3-7 days depending on month length). Every block stays inside one month,
// so there's no cross-month boundary week to worry about.
export function weeksOfMonth(year: number, month0: number): WeekInfo[] {
  const lastDay = new Date(year, month0 + 1, 0).getDate();
  const weeks: WeekInfo[] = [];
  let idx = 1;
  for (let day = 1; day <= lastDay; day += 7) {
    const start = new Date(year, month0, day);
    const end = new Date(year, month0, Math.min(day + 6, lastDay));
    weeks.push({
      key: toIso(start),
      index: idx,
      start: toIso(start),
      end: toIso(end),
      label: `สัปดาห์ที่ ${idx}`,
      range: `${shortDay(start)} – ${shortDay(end)}`,
    });
    idx++;
  }
  return weeks;
}

// which week key a transaction date belongs to
export function weekKeyOf(iso: string): string {
  const d = fromIso(iso);
  const blockStartDay = Math.floor((d.getDate() - 1) / 7) * 7 + 1;
  return toIso(new Date(d.getFullYear(), d.getMonth(), blockStartDay));
}

export function monthLabel(year: number, month0: number): string {
  return `${THAI_MONTHS_FULL[month0]} ${year + 543}`; // Buddhist year
}

export function todayIso(): string {
  return toIso(new Date());
}

// days remaining in week [start,end] counting from today (inclusive), min 1
export function daysLeftInWeek(startIso: string, endIso: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = fromIso(startIso);
  const end = fromIso(endIso);
  if (today < start) {
    return 7; // future week: full week
  }
  if (today > end) return 0; // past week
  const diff = Math.round((end.getTime() - today.getTime()) / 86400000) + 1;
  return Math.max(1, diff);
}

export function isCurrentWeek(startIso: string, endIso: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today >= fromIso(startIso) && today <= fromIso(endIso);
}
