export const CURRENCIES: Record<string, { locale: string; label: string }> = {
  THB: { locale: "th-TH", label: "บาท (฿)" },
  USD: { locale: "en-US", label: "US Dollar ($)" },
  EUR: { locale: "de-DE", label: "Euro (€)" },
  JPY: { locale: "ja-JP", label: "Yen (¥)" },
  GBP: { locale: "en-GB", label: "Pound (£)" },
};

// module-level current currency, updated by SettingsProvider
let currentCurrency = "THB";
export function setCurrentCurrency(c: string) {
  if (CURRENCIES[c]) currentCurrency = c;
}

export function formatMoney(n: number, currency = currentCurrency): string {
  const meta = CURRENCIES[currency] ?? CURRENCIES.THB;
  const fraction = currency === "JPY" ? 0 : 2;
  return new Intl.NumberFormat(meta.locale, {
    style: "currency",
    currency,
    minimumFractionDigits: fraction,
    maximumFractionDigits: fraction,
  }).format(n);
}

/** @deprecated use formatMoney */
export function formatBaht(n: number): string {
  return formatMoney(n);
}

export function formatDateThai(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("th-TH", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(d);
}

export function todayIso(): string {
  const d = new Date();
  const off = d.getTimezoneOffset();
  const local = new Date(d.getTime() - off * 60000);
  return local.toISOString().slice(0, 10);
}
