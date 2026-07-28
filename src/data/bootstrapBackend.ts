import { getBackendSettings } from './backendSettings';
import { LocalStorageAdapter, setActiveAdapter } from './storageAdapter';
import { GoogleSheetsAdapter } from './adapters/googleSheetsAdapter';

/** Reads the persisted backend choice and activates the matching adapter. Call once on app boot, before any repository is used. */
export async function applyBackendSettings(): Promise<void> {
  const settings = getBackendSettings();

  if (settings.active === 'google-sheets' && settings.googleSheets?.webAppUrl) {
    setActiveAdapter(new GoogleSheetsAdapter(settings.googleSheets));
    return;
  }

  if (settings.active === 'firebase' && settings.firebase?.projectId) {
    const { FirebaseAdapter } = await import('./adapters/firebaseAdapter');
    setActiveAdapter(new FirebaseAdapter(settings.firebase));
    return;
  }

  setActiveAdapter(new LocalStorageAdapter());
}
