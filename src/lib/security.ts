import { timingSafeEqual } from "node:crypto";

export function secureEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return timingSafeEqual(leftBuffer, rightBuffer);
}

export function isAuthorizedBearer(header: string | null, secret: string): boolean {
  if (!header?.startsWith("Bearer ") || secret.length < 32) return false;
  return secureEqual(header.slice(7), secret);
}

export function safeRedirectPath(value: string | null | undefined, fallback = "/app"): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return fallback;
  try {
    const parsed = new URL(value, "https://jobos.invalid");
    if (parsed.origin !== "https://jobos.invalid") return fallback;
    return `${parsed.pathname}${parsed.search}${parsed.hash}`;
  } catch {
    return fallback;
  }
}

export function normalizeHeaderText(value: string, maxLength: number): string {
  return value.replace(/[\r\n]+/g, " ").trim().slice(0, maxLength);
}
