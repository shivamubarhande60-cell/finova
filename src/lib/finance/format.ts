import { format, parseISO } from "date-fns";
import type { Currency, Period } from "./types";

const LOCALE: Record<Currency, string> = {
  USD: "en-US",
  INR: "en-IN",
  EUR: "en-GB",
  GBP: "en-GB",
};

export function money(value: number, currency: Currency, opts?: { sign?: boolean }) {
  const abs = Math.abs(value);
  const formatted = new Intl.NumberFormat(LOCALE[currency], {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(abs);
  if (!opts?.sign) return value < 0 ? `-${formatted}` : formatted;
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `-${formatted}`;
  return formatted;
}

export function moneyCompact(value: number, currency: Currency) {
  return new Intl.NumberFormat(LOCALE[currency], {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

export function pct(value: number) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toFixed(0)}%`;
}

export function prettyDate(iso: string) {
  try {
    return format(parseISO(iso), "d MMM yyyy");
  } catch {
    return iso;
  }
}

export function prettyDateShort(iso: string) {
  try {
    return format(parseISO(iso), "d MMM");
  } catch {
    return iso;
  }
}

export function monthKey(iso: string) {
  return iso.slice(0, 7);
}

export function periodLabel(period: Period) {
  switch (period) {
    case "this-month":
      return "This month";
    case "last-month":
      return "Last month";
    case "30d":
      return "Last 30 days";
    case "90d":
      return "Last 90 days";
    case "ytd":
      return "Year to date";
    case "all":
      return "All time";
  }
}

export const PERIODS: Period[] = ["this-month", "last-month", "30d", "90d", "ytd", "all"];
