import { parsePhoneNumberFromString } from "libphonenumber-js";

export function parseMobileNumber(raw: string) {
  const value = raw.trim();
  const phone = parsePhoneNumberFromString(value, value.startsWith("+") ? undefined : "IN");
  if (!phone?.isValid()) return null;
  const type = phone.getType();
  if (type && type !== "MOBILE" && type !== "FIXED_LINE_OR_MOBILE") return null;
  return phone.number;
}

export function isValidMobileNumber(raw: string) {
  return parseMobileNumber(raw) !== null;
}