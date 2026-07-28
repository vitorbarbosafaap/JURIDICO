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

// Swap this single line to point the whole app at a different backend
// (e.g. new GoogleSheetsAdapter() or new FirebaseAdapter()) once Fase 4 lands.
export const storage: StorageAdapter = new LocalStorageAdapter();
