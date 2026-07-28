import { useEffect, useState, type ReactNode } from 'react';
import type { FirebaseBackendConfig } from '../data/types';

interface AuthModule {
  auth: import('firebase/auth').Auth;
  GoogleAuthProvider: typeof import('firebase/auth').GoogleAuthProvider;
  signInWithPopup: typeof import('firebase/auth').signInWithPopup;
  signOut: typeof import('firebase/auth').signOut;
}

export function FirebaseAuthGate({ config, children }: { config: FirebaseBackendConfig; children: ReactNode }) {
  const [user, setUser] = useState<{ email: string | null } | null>(null);
  const [loading, setLoading] = useState(true);
  const [authModule, setAuthModule] = useState<AuthModule | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let unsub: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        const { initializeApp, getApps, getApp } = await import('firebase/app');
        const { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut } = await import(
          'firebase/auth'
        );
        const app = getApps().length
          ? getApp()
          : initializeApp({
              apiKey: config.apiKey,
              authDomain: config.authDomain,
              projectId: config.projectId,
              appId: config.appId,
            });
        const auth = getAuth(app);
        if (cancelled) return;
        setAuthModule({ auth, GoogleAuthProvider, signInWithPopup, signOut });
        unsub = onAuthStateChanged(auth, (u) => {
          setUser(u ? { email: u.email } : null);
          setLoading(false);
        });
      } catch (err) {
        if (!cancelled) {
          setError('Não foi possível conectar ao Firebase. Verifique a configuração em Configurações.');
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [config]);

  async function handleLogin() {
    if (!authModule) return;
    setError('');
    try {
      await authModule.signInWithPopup(authModule.auth, new authModule.GoogleAuthProvider());
    } catch {
      setError('Falha ao entrar com Google. Tente novamente.');
    }
  }

  if (loading) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', color: 'var(--pitzi-muted)' }}>
        Conectando ao Firebase…
      </div>
    );
  }

  if (!user) {
    return (
      <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--pitzi-bg)' }}>
        <div className="card card-pad" style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Jurídico Pitzi</h2>
          <p className="text-muted text-sm" style={{ marginBottom: 20 }}>
            Entre com sua conta Google para acessar os dados sincronizados no Firebase.
          </p>
          <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} onClick={handleLogin}>
            Entrar com Google
          </button>
          {error && (
            <p className="text-sm" style={{ color: 'var(--pitzi-danger)', marginTop: 12 }}>
              {error}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
