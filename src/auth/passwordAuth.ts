// Simple local password gate — deliberately independent of the pluggable
// StorageAdapter (reads/writes localStorage directly), since it decides
// whether the app is allowed to boot at all. Optional: if no password has
// ever been configured, the app opens with no gate — this matches
// personal/internal-use defaults, and only exists to add a light layer of
// protection on a shared machine.

const HASH_KEY = 'pitzi-juridico:v1:authHash';
const UNLOCKED_KEY = 'pitzi-juridico:v1:unlocked';

export async function sha256(text: string): Promise<string> {
  const bytes = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function hasPasswordConfigured(): boolean {
  return !!window.localStorage.getItem(HASH_KEY);
}

export async function setPassword(password: string): Promise<void> {
  window.localStorage.setItem(HASH_KEY, await sha256(password));
}

export function clearPassword(): void {
  window.localStorage.removeItem(HASH_KEY);
}

export async function checkPassword(password: string): Promise<boolean> {
  const stored = window.localStorage.getItem(HASH_KEY);
  if (!stored) return true;
  return (await sha256(password)) === stored;
}

export function isUnlocked(): boolean {
  return window.sessionStorage.getItem(UNLOCKED_KEY) === '1';
}

export function markUnlocked(): void {
  window.sessionStorage.setItem(UNLOCKED_KEY, '1');
}

export function lock(): void {
  window.sessionStorage.removeItem(UNLOCKED_KEY);
}
