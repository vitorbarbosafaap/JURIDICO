import { storage } from './storageAdapter';
import { logGlobalAudit } from './globalAudit';
import type { ID, SoftDeletable } from './types';

export { newId } from './id';

// Best-effort human label for an audit entry — most of our entities carry
// one of these fields; falls back to the id if none match.
function labelFor(item: Record<string, unknown>): string {
  const candidates = ['titulo', 'nome', 'parceiro', 'numeroCNJ', 'tipoAcao', 'tipo', 'descricao'];
  for (const key of candidates) {
    const value = item[key];
    if (typeof value === 'string' && value.trim()) return value;
  }
  return String(item.id ?? 'registro');
}

// Generic repository giving every collection consistent CRUD + soft-delete
// semantics on top of the pluggable StorageAdapter. Every mutation is also
// mirrored into the global audit log (src/data/globalAudit.ts) for the
// Auditoria page — best-effort, never blocks or throws on the caller.
export class Repository<T extends { id: ID } & SoftDeletable> {
  private cache: T[] | null = null;
  private listeners = new Set<() => void>();

  constructor(private collection: string) {}

  subscribe(fn: () => void): () => void {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private async load(): Promise<T[]> {
    if (this.cache) return this.cache;
    this.cache = await storage.getAll<T>(this.collection);
    return this.cache;
  }

  private async persist() {
    await storage.saveAll(this.collection, this.cache ?? []);
    this.notify();
  }

  private audit(entidadeId: string, entidadeLabel: string, acao: 'criação' | 'atualização' | 'exclusão' | 'restauração') {
    logGlobalAudit({ colecao: this.collection, entidadeId, entidadeLabel, acao, autor: 'Você' }).catch(() => {});
  }

  async list(includeDeleted = false): Promise<T[]> {
    const all = await this.load();
    return includeDeleted ? all : all.filter((item) => !item.deletedAt);
  }

  async get(id: ID): Promise<T | undefined> {
    const all = await this.load();
    return all.find((item) => item.id === id);
  }

  async create(item: T): Promise<T> {
    const all = await this.load();
    all.push(item);
    await this.persist();
    this.audit(item.id, labelFor(item as unknown as Record<string, unknown>), 'criação');
    return item;
  }

  private async applyPatch(id: ID, patch: Partial<T>): Promise<T | undefined> {
    const all = await this.load();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...patch };
    await this.persist();
    return all[idx];
  }

  async update(id: ID, patch: Partial<T>): Promise<T | undefined> {
    const updated = await this.applyPatch(id, patch);
    if (updated) this.audit(id, labelFor(updated as unknown as Record<string, unknown>), 'atualização');
    return updated;
  }

  async softDelete(id: ID): Promise<void> {
    const updated = await this.applyPatch(id, { deletedAt: new Date().toISOString() } as Partial<T>);
    if (updated) this.audit(id, labelFor(updated as unknown as Record<string, unknown>), 'exclusão');
  }

  async restore(id: ID): Promise<void> {
    const updated = await this.applyPatch(id, { deletedAt: null } as Partial<T>);
    if (updated) this.audit(id, labelFor(updated as unknown as Record<string, unknown>), 'restauração');
  }

  async hardDelete(id: ID): Promise<void> {
    const all = await this.load();
    this.cache = all.filter((item) => item.id !== id);
    await this.persist();
  }

  async listDeleted(): Promise<T[]> {
    const all = await this.load();
    return all.filter((item) => !!item.deletedAt);
  }

  async replaceAll(items: T[]): Promise<void> {
    this.cache = items;
    await this.persist();
  }
}
