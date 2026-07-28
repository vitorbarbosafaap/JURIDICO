import { storage } from './storageAdapter';
import type { ID, SoftDeletable } from './types';

// Generic repository giving every collection consistent CRUD + soft-delete
// semantics on top of the pluggable StorageAdapter.
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
    return item;
  }

  async update(id: ID, patch: Partial<T>): Promise<T | undefined> {
    const all = await this.load();
    const idx = all.findIndex((item) => item.id === id);
    if (idx === -1) return undefined;
    all[idx] = { ...all[idx], ...patch };
    await this.persist();
    return all[idx];
  }

  async softDelete(id: ID): Promise<void> {
    await this.update(id, { deletedAt: new Date().toISOString() } as Partial<T>);
  }

  async restore(id: ID): Promise<void> {
    await this.update(id, { deletedAt: null } as Partial<T>);
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

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
