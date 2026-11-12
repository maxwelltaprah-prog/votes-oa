/**
 * Date of birth is the login password. Employees type it as DD/MM/YYYY, but we accept a few
 * common variants and reduce them all to one canonical string, "DDMMYYYY", before hashing/comparing.
 *
 * Accepted: 05/03/1990, 5/3/1990, 05-03-1990, 05.03.1990, 05 03 1990, 05031990
 * Always day first (DD/MM/YYYY). Returns null if the text is not a real calendar date.
 *
 * Keep this in sync with scripts/lib.mjs.
 */
export function normalizeDob(input: string): string | null {
  const s = (input || "").trim();

  let d: number, m: number, y: number;
  const spaced = s.match(/^(\d{1,2})[\/\-.\s](\d{1,2})[\/\-.\s](\d{4})$/);
  const compact = s.match(/^(\d{2})(\d{2})(\d{4})$/);
  if (spaced) {
    [d, m, y] = [Number(spaced[1]), Number(spaced[2]), Number(spaced[3])];
  } else if (compact) {
    [d, m, y] = [Number(compact[1]), Number(compact[2]), Number(compact[3])];
  } else {
    return null;
  }

  if (y < 1900 || y > new Date().getFullYear()) return null;
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) return null;

  return String(d).padStart(2, "0") + String(m).padStart(2, "0") + String(y);
}
