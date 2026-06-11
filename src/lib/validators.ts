/**
 * validators.ts — shared field validation used by client forms and
 * (mirrored in) server zod schemas. Client checks give instant, friendly
 * errors; the server zod schemas remain the security boundary.
 */

// Nepali numbers: mobile 98/97/96xxxxxxxx, landline 0X-XXXXXXX; allow +977.
export const PHONE_RE = /^(\+?977[- ]?)?(9[5-8]\d{8}|0\d{1,2}[- ]?\d{6,7})$/;
// Bikram Sambat date as used in the app: YYYY-MM-DD, years 2070–2110.
export const BS_DATE_RE = /^(20[7-9]\d|2110)-(0?[1-9]|1[0-2])-(0?[1-9]|[12]\d|3[0-2])$/;
export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
export const ADSENSE_CLIENT_RE = /^ca-pub-\d{10,20}$/;
export const NUMERIC_SLOT_RE = /^\d{1,30}$/;

export type FieldError = string | null;

export const v = {
  required(value: string, label: string): FieldError {
    return value.trim() ? null : `${label} is required`;
  },
  name(value: string): FieldError {
    const t = value.trim();
    if (!t) return "Name is required";
    if (t.length < 2) return "Name must be at least 2 characters";
    if (t.length > 120) return "Name must be under 120 characters";
    return null;
  },
  email(value: string): FieldError {
    const t = value.trim();
    if (!t) return "Email is required";
    if (!EMAIL_RE.test(t)) return "Enter a valid email address";
    return null;
  },
  password(value: string, { signup = false } = {}): FieldError {
    if (!value) return "Password is required";
    if (signup && value.length < 8) return "Password must be at least 8 characters";
    return null;
  },
  phone(value: string, { optional = true } = {}): FieldError {
    const t = value.trim();
    if (!t) return optional ? null : "Phone number is required";
    if (!PHONE_RE.test(t)) return "Enter a valid Nepali phone (e.g. 98XXXXXXXX)";
    return null;
  },
  bsDate(value: string, { optional = true } = {}): FieldError {
    const t = value.trim();
    if (!t) return optional ? null : "Date is required";
    if (!BS_DATE_RE.test(t)) return "Use BS date format YYYY-MM-DD (e.g. 2081-04-15)";
    return null;
  },
  amount(value: string | number, label: string, { min = 0, max = 10_000_000, allowZero = false } = {}): FieldError {
    const n = typeof value === "number" ? value : Number(value);
    if (value === "" || Number.isNaN(n) || !Number.isFinite(n)) return `${label} must be a number`;
    if (!allowZero && n <= min) return `${label} must be greater than ${min}`;
    if (allowZero && n < min) return `${label} cannot be less than ${min}`;
    if (n > max) return `${label} is too large (max ${max.toLocaleString()})`;
    return null;
  },
  intRange(value: string | number, label: string, min: number, max: number): FieldError {
    const n = typeof value === "number" ? value : Number(value);
    if (value === "" || !Number.isInteger(n)) return `${label} must be a whole number`;
    if (n < min || n > max) return `${label} must be between ${min} and ${max}`;
    return null;
  },
  maxLen(value: string, label: string, max: number): FieldError {
    return value.length > max ? `${label} must be under ${max} characters` : null;
  },
  dateOrder(from: string, to: string): FieldError {
    if (!from || !to) return null;
    return new Date(from) <= new Date(to) ? null : "'Period from' must be on or before 'Period to'";
  },
  adsenseClient(value: string): FieldError {
    const t = value.trim();
    if (!t) return null; // empty allowed while ads are off
    return ADSENSE_CLIENT_RE.test(t) ? null : "Must look like ca-pub-XXXXXXXXXXXXXXXX";
  },
  adSlot(value: string, label: string): FieldError {
    const t = value.trim();
    if (!t) return null;
    return NUMERIC_SLOT_RE.test(t) ? null : `${label} must be numeric`;
  },
};

/** Returns the first error from a list of checks, or null if all pass. */
export function firstError(...errors: FieldError[]): FieldError {
  return errors.find((e) => e !== null) ?? null;
}
