// PIN is a soft device-lock (not a security boundary) — hashed client-side,
// no salt needed since the threat model is "someone picks up the phone",
// not an attacker with the Firestore doc.
export async function hashPin(pin: string): Promise<string> {
  const bytes = new TextEncoder().encode(pin);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const UNLOCK_KEY = "rubjai_unlocked";

export function isUnlockedThisSession(): boolean {
  return sessionStorage.getItem(UNLOCK_KEY) === "1";
}

export function markUnlocked(): void {
  sessionStorage.setItem(UNLOCK_KEY, "1");
}
