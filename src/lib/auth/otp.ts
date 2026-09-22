import { createServerFn } from "@tanstack/react-start";

type Method = "email" | "phone";
type Pending = { hash: string; expires: number; tries: number; sentAt: number };

const pending = new Map<string, Pending>();
const sends: number[] = [];

function clip(value: string, max: number) {
  return value.trim().slice(0, max);
}

function normalizeEmail(raw: string) {
  return clip(raw, 120).toLowerCase();
}

function normalizePhone(raw: string) {
  const digits = raw.replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return clip(digits, 16);
  if (digits.length === 10) return `+91${digits}`;
  if (digits.length === 12 && digits.startsWith("91")) return `+${digits}`;
  return clip(digits.startsWith("+") ? digits : `+${digits}`, 16);
}

function validEmail(v: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

function validPhone(v: string) {
  return /^\+\d{10,15}$/.test(v);
}

function hashCode(code: string) {
  let h = 2166136261;
  for (let i = 0; i < code.length; i++) h = Math.imul(h ^ code.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16);
}

function allowSend() {
  const now = Date.now();
  while (sends.length && now - sends[0]! > 60_000) sends.shift();
  if (sends.length >= 8) return false;
  sends.push(now);
  return true;
}

function sixDigit() {
  return String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
}

export const sendOtpFn = createServerFn({ method: "POST" })
  .validator((input: { method: Method; destination: string }) => ({
    method: input.method === "phone" ? ("phone" as const) : ("email" as const),
    destination: clip(String(input.destination ?? ""), 120),
  }))
  .handler(async ({ data }) => {
    const dest = data.method === "email" ? normalizeEmail(data.destination) : normalizePhone(data.destination);
    if (data.method === "email" && !validEmail(dest)) {
      return { ok: false as const, error: "Enter a valid email." };
    }
    if (data.method === "phone" && !validPhone(dest)) {
      return { ok: false as const, error: "Enter a valid phone number with country code." };
    }
    const prev = pending.get(`${data.method}:${dest}`);
    if (prev && Date.now() - prev.sentAt < 20_000) {
      return { ok: false as const, error: "Wait a few seconds before requesting another code." };
    }
    if (!allowSend()) return { ok: false as const, error: "Too many codes. Try again in a minute." };

    const code = sixDigit();
    pending.set(`${data.method}:${dest}`, {
      hash: hashCode(code),
      expires: Date.now() + 5 * 60_000,
      tries: 0,
      sentAt: Date.now(),
    });
    return {
      ok: true as const,
      previewCode: code,
      destination: dest,
    };
  });

export const verifyOtpFn = createServerFn({ method: "POST" })
  .validator((input: { method: Method; destination: string; code: string }) => ({
    method: input.method === "phone" ? ("phone" as const) : ("email" as const),
    destination: clip(String(input.destination ?? ""), 120),
    code: String(input.code ?? "").replace(/\D/g, "").slice(0, 6),
  }))
  .handler(async ({ data }) => {
    const dest = data.method === "email" ? normalizeEmail(data.destination) : normalizePhone(data.destination);
    const row = pending.get(`${data.method}:${dest}`);
    if (!row) return { ok: false as const, error: "Request a code first." };
    if (Date.now() > row.expires) {
      pending.delete(`${data.method}:${dest}`);
      return { ok: false as const, error: "That code expired. Request a new one." };
    }
    if (row.tries >= 5) {
      pending.delete(`${data.method}:${dest}`);
      return { ok: false as const, error: "Too many attempts. Request a new code." };
    }
    row.tries += 1;
    if (hashCode(data.code) !== row.hash) {
      return { ok: false as const, error: "Wrong code. Try again." };
    }
    pending.delete(`${data.method}:${dest}`);
    const id = data.method === "email" ? `em_${dest}` : `ph_${dest.replace(/\D/g, "")}`;
    const displayName = data.method === "email" ? dest.split("@")[0]! : dest;
    return {
      ok: true as const,
      token: `finova.${id}.${Date.now()}`,
      user: { id, displayName, destination: dest, method: data.method },
    };
  });
