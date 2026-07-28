import type { StorageAdapter } from '../storageAdapter';
import type { GoogleSheetsBackendConfig } from '../types';

// Talks to a Google Apps Script Web App (see docs/apps-script/Code.gs) that
// stores each collection as one JSON blob per sheet tab — matching this
// adapter's get-all/save-all-at-once contract exactly, so no per-row
// diffing is needed on either side.
//
// POST bodies are sent as `text/plain` on purpose: a JSON content-type would
// trigger a CORS preflight (OPTIONS) request, which Apps Script Web Apps
// cannot answer, silently breaking every write.
export class GoogleSheetsAdapter implements StorageAdapter {
  constructor(private config: GoogleSheetsBackendConfig) {}

  async getAll<T>(collection: string): Promise<T[]> {
    const url = new URL(this.config.webAppUrl);
    url.searchParams.set('action', 'list');
    url.searchParams.set('collection', collection);
    if (this.config.apiKey) url.searchParams.set('key', this.config.apiKey);

    const res = await fetch(url.toString());
    if (!res.ok) throw new Error(`Google Sheets: falha ao ler "${collection}" (HTTP ${res.status})`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? `Google Sheets: erro desconhecido ao ler "${collection}"`);
    return (json.data ?? []) as T[];
  }

  async saveAll<T>(collection: string, items: T[]): Promise<void> {
    const res = await fetch(this.config.webAppUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action: 'save', collection, data: items, key: this.config.apiKey }),
    });
    if (!res.ok) throw new Error(`Google Sheets: falha ao gravar "${collection}" (HTTP ${res.status})`);
    const json = await res.json();
    if (!json.ok) throw new Error(json.error ?? `Google Sheets: erro desconhecido ao gravar "${collection}"`);
  }

  /** Used by the Configurações "Testar conexão" button. */
  async ping(): Promise<void> {
    await this.getAll('__ping__');
  }
}
