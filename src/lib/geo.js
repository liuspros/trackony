export const CODE_LENGTH = 8;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function newCode() {
  const bytes = new Uint8Array(CODE_LENGTH);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}
export const normalizeCode = (s) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");
export const prettyCode = (c) => (c ? c.slice(0, 4) + "-" + c.slice(4) : "");

export function distanceKm(a, b) {
  const R = 6371;
  const r = (x) => (x * Math.PI) / 180;
  const h =
    Math.sin(r(b[0] - a[0]) / 2) ** 2 +
    Math.cos(r(a[0])) * Math.cos(r(b[0])) * Math.sin(r(b[1] - a[1]) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function formatAgo(ms) {
  if (ms == null) return "—";
  const s = Math.max(0, Math.round(ms / 1000));
  return s < 60 ? `${s}s ago` : `${Math.round(s / 60)} min ago`;
}
export const formatSpeed = (mps) => (mps == null ? "—" : `${Math.round(mps * 3.6)} km/h`);
