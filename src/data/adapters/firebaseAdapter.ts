import type { StorageAdapter } from '../storageAdapter';
import type { FirebaseBackendConfig } from '../types';

// Firestore-backed adapter. The Firebase SDK is only ever loaded (via
// dynamic import) when this adapter is actually instantiated — selecting
// Local or Google Sheets in Configurações never pulls it into the bundle.
export class FirebaseAdapter implements StorageAdapter {
  private dbPromise: Promise<import('firebase/firestore').Firestore> | null = null;

  constructor(private config: FirebaseBackendConfig) {}

  private async db() {
    if (!this.dbPromise) {
      this.dbPromise = (async () => {
        const { initializeApp, getApps, getApp } = await import('firebase/app');
        const { getFirestore } = await import('firebase/firestore');
        const app = getApps().length
          ? getApp()
          : initializeApp({
              apiKey: this.config.apiKey,
              authDomain: this.config.authDomain,
              projectId: this.config.projectId,
              appId: this.config.appId,
            });
        return getFirestore(app);
      })();
    }
    return this.dbPromise;
  }

  async getAll<T>(collectionName: string): Promise<T[]> {
    const { collection, getDocs } = await import('firebase/firestore');
    const db = await this.db();
    const snap = await getDocs(collection(db, collectionName));
    return snap.docs.map((d) => d.data() as T);
  }

  async saveAll<T>(collectionName: string, items: T[]): Promise<void> {
    const { collection, getDocs, writeBatch, doc } = await import('firebase/firestore');
    const db = await this.db();
    const colRef = collection(db, collectionName);
    const existing = await getDocs(colRef);
    const batch = writeBatch(db);
    const newIds = new Set(items.map((item) => (item as { id: string }).id));
    existing.forEach((docSnap) => {
      if (!newIds.has(docSnap.id)) batch.delete(docSnap.ref);
    });
    items.forEach((item) => {
      const id = (item as { id: string }).id;
      batch.set(doc(colRef, id), item as Record<string, unknown>);
    });
    await batch.commit();
  }

  /** Used by the Configurações "Testar conexão" button. */
  async ping(): Promise<void> {
    await this.getAll('__ping__');
  }
}
