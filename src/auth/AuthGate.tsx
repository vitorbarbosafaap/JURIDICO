import { type ReactNode } from 'react';
import { getBackendSettings } from '../data/backendSettings';
import { FirebaseAuthGate } from './FirebaseAuthGate';
import { LocalPasswordGate } from './LocalPasswordGate';

export function AuthGate({ children }: { children: ReactNode }) {
  const settings = getBackendSettings();

  if (settings.active === 'firebase' && settings.firebase?.projectId) {
    return <FirebaseAuthGate config={settings.firebase}>{children}</FirebaseAuthGate>;
  }

  return <LocalPasswordGate>{children}</LocalPasswordGate>;
}
