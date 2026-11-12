/**
 * Normalise a telephone number so that "0803 123 4567", "+234 803 123 4567" and "2348031234567"
 * all produce the same password string: "08031234567".
 * Keep this in sync with scripts/lib.mjs.
 */
export function normalizePhone(input: string): string {
  let digits = (input || "").replace(/\D/g, "");
  if (digits.startsWith("234") && digits.length === 13) {
    digits = "0" + digits.slice(3);
  }
  return digits;
}
