const REFERENCE_PREFIX = "SK-2034-";

/** Same address, same thread: a small string hash folded into four digits. */
export function threadReference(email: string): string {
  let hash = 0;
  for (const character of email.trim().toLowerCase()) {
    hash = (hash * 31 + (character.codePointAt(0) ?? 0)) >>> 0;
  }
  return `${REFERENCE_PREFIX}${String(hash % 10000).padStart(4, "0")}`;
}
