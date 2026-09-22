const MAX_TX = 8000;
const MAX_LIST = 200;

export function sanitizeText(value: unknown, max = 120) {
  return String(value ?? "")
    .replace(/[\u0000-\u001F\u007F]/g, "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, max);
}

export function sanitizeAmount(value: unknown, max = 1_000_000_000) {
  const n = typeof value === "number" ? value : Number(String(value).replace(/,/g, ""));
  if (!Number.isFinite(n) || n <= 0) return null;
  return Math.min(Math.round(n * 100) / 100, max);
}

export function sanitizeDate(value: unknown) {
  const raw = String(value ?? "").slice(0, 10);
  return /^\d{4}-\d{2}-\d{2}$/.test(raw) ? raw : new Date().toISOString().slice(0, 10);
}

export function neutralizeFormula(value: string) {
  return /^[=+\-@|\t]/.test(value) ? `'${value}` : value;
}

export function stripFormula(value: string) {
  return value.replace(/^['=+\-@|\t]+/, "");
}

export const LIMITS = { MAX_TX, MAX_LIST };
