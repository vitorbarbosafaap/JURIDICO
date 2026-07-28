// Storage abstraction so the persistence backend can be swapped later
// (Google Sheets via Apps Script Web App, or Firebase/Firestore) without
// touching any repository or UI code. Everything is async on purpose,
// even though localStorage is synchronous, to match future adapters.

export interface StorageAdapter {
  getAll<T>(collection: string): Promise<T[]>;
  saveAll<T>(collection: string, items: T[]): Promise<void>;
}

const NAMESPACE = 'pitzi-juridico:v1:';

export class LocalStorageAdapter implements StorageAdapter {
  async getAll<T>(collection: string): Promise<T[]> {
    try {
      const raw = window.localStorage.getItem(NAMESPACE + collection);
      if (!raw) return [];
      return JSON.parse(raw) as T[];
    } catch (err) {
      console.error(`[storage] falha ao ler "${collection}"`, err);
      return [];
    }
  }

  async saveAll<T>(collection: string, items: T[]): Promise<void> {
    try {
      window.localStorage.setItem(NAMESPACE + collection, JSON.stringify(items));
    } catch (err) {
      console.error(`[storage] falha ao gravar "${collection}"`, err);
      throw err;
    }
  }
}

// `storage` is a stable dispatcher — repositories hold this reference forever,
// but every call is forwarded to whichever adapter is currently active. This
// lets Configurações → Integração de Dados swap the backend (Local, Google
// Sheets, Firebase) at runtime via setActiveAdapter(), without repositories
// ever needing to know. See src/data/bootstrapBackend.ts for how the choice
// persisted in BackendSettings gets applied on app boot.
let activeAdapter: StorageAdapter = new LocalStorageAdapter();

export function setActiveAdapter(adapter: StorageAdapter): void {
  activeAdapter = adapter;
}

export function getActiveAdapter(): StorageAdapter {
  return activeAdapter;
}

class DispatchingAdapter implements StorageAdapter {
  getAll<T>(collection: string): Promise<T[]> {
    return activeAdapter.getAll<T>(collection);
  }
  saveAll<T>(collection: string, items: T[]): Promise<void> {
    return activeAdapter.saveAll<T>(collection, items);
  }
}

export const storage: StorageAdapter = new DispatchingAdapter();
