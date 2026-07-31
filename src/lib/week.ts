// Week = Monday..Sunday. Week key = Monday's local date (YYYY-MM-DD).

const THAI_MONTHS = [
  "ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.",
  "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค.",
];

const THAI_MONTHS_FULL = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];

export interface WeekInfo {
  key: string; // Monday YYYY-MM-DD
  index: number; // 1-based within month
  start: string; // Monday YYYY-MM-DD
  end: string; // Sunday YYYY-MM-DD
  label: string; // "สัปดาห์ที่ 1"
  range: string; // "28 ก.ค. – 3 ส.ค."
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

// Monday of the week containing d
export function mondayOf(d: Date): Date {
  const day = d.getDay(); // 0=Sun..6=Sat
  const offset = (day + 6) % 7; // Mon=0
  return addDays(d, -offset);
}

function shortDay(d: Date): string {
  return `${d.getDate()} ${THAI_MONTHS[d.getMonth()]}`;
}

// Mon..Sun weeks that BELONG to the given month.
// A week belongs to the month that contains its Thursday (the week's majority),
// so every calendar week maps to exactly ONE month — no boundary week is
// counted in two months.
export function weeksOfMonth(year: number, month0: number): WeekInfo[] {
  const first = new Date(year, month0, 1);
  const last = new Date(year, month0 + 1, 0);
  let cursor = mondayOf(first);
  const weeks: WeekInfo[] = [];
  let idx = 1;
  while (cursor <= last) {
    const thursday = addDays(cursor, 3);
    if (thursday.getFullYear() === year && thursday.getMonth() === month0) {
      const start = cursor;
      const end = addDays(cursor, 6);
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
    cursor = addDays(cursor, 7);
  }
  return weeks;
}

// which week key a transaction date belongs to
export function weekKeyOf(iso: string): string {
  return toIso(mondayOf(fromIso(iso)));
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
