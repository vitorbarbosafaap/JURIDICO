import { storage } from './storageAdapter';
import { newId } from './id';
import type { GlobalAuditEntry } from './types';

// Separate module (rather than living in db.ts or repository.ts) so both can
// depend on it without a circular import — Repository logs mutations here,
// and db.ts/pages just read from it.
const GLOBAL_AUDIT_KEY = 'globalAudit';

export async function logGlobalAudit(entry: Omit<GlobalAuditEntry, 'id' | 'at'>): Promise<void> {
  const rows = await storage.getAll<GlobalAuditEntry>(GLOBAL_AUDIT_KEY);
  rows.push({ ...entry, id: newId(), at: new Date().toISOString() });
  // Cap history so this doesn't grow unbounded in localStorage.
  const trimmed = rows.slice(-2000);
  await storage.saveAll(GLOBAL_AUDIT_KEY, trimmed);
}

export async function listGlobalAudit(): Promise<GlobalAuditEntry[]> {
  const rows = await storage.getAll<GlobalAuditEntry>(GLOBAL_AUDIT_KEY);
  return rows.slice().sort((a, b) => b.at.localeCompare(a.at));
}
