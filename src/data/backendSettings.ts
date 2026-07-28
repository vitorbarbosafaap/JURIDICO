import type { BackendSettings } from './types';

// Deliberately bypasses the pluggable StorageAdapter — this is the one piece
// of state that decides *which* adapter is active, so it must always live in
// the browser's own localStorage, never behind the abstraction it configures.
const KEY = 'pitzi-juridico:v1:backendSettings';

const DEFAULT_SETTINGS: BackendSettings = { active: 'local' };

export function getBackendSettings(): BackendSettings {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveBackendSettings(settings: BackendSettings): void {
  window.localStorage.setItem(KEY, JSON.stringify(settings));
}
