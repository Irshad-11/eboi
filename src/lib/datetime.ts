/**
 * The shop runs on Dhaka time (UTC+6, no daylight saving). <input
 * type="datetime-local"> has no timezone, so admin inputs are read and written
 * as Dhaka wall-clock time regardless of where the admin's browser is.
 */
const OFFSET_MS = 6 * 60 * 60 * 1000;

export function toDhakaInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const t = Date.parse(iso);
  return Number.isNaN(t) ? "" : new Date(t + OFFSET_MS).toISOString().slice(0, 16);
}

export function fromDhakaInput(value: string): string | null {
  if (!value) return null;
  const t = Date.parse(`${value.length === 16 ? `${value}:00` : value}+06:00`);
  return Number.isNaN(t) ? null : new Date(t).toISOString();
}

export function todayInDhaka(): string {
  return new Date(Date.now() + OFFSET_MS).toISOString().slice(0, 10);
}
