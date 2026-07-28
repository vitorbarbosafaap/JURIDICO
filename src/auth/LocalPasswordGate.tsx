import { useState, type ReactNode } from 'react';
import { checkPassword, hasPasswordConfigured, isUnlocked, markUnlocked } from './passwordAuth';

export function LocalPasswordGate({ children }: { children: ReactNode }) {
  const [unlocked, setUnlocked] = useState(isUnlocked() || !hasPasswordConfigured());
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ok = await checkPassword(password);
    if (ok) {
      markUnlocked();
      setUnlocked(true);
    } else {
      setError(true);
    }
  }

  if (unlocked) return <>{children}</>;

  return (
    <div style={{ display: 'grid', placeItems: 'center', height: '100vh', background: 'var(--pitzi-bg)' }}>
      <form className="card card-pad" style={{ maxWidth: 340, width: '100%' }} onSubmit={handleSubmit}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 10,
              background: 'var(--pitzi-accent)',
              color: '#fff',
              fontWeight: 800,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
              fontSize: 18,
            }}
          >
            P
          </div>
          <h2 style={{ fontSize: 17 }}>Jurídico Pitzi</h2>
          <p className="text-muted text-sm">Digite a senha local para acessar o sistema.</p>
        </div>
        <div className="field">
          <input
            className="input"
            type="password"
            autoFocus
            placeholder="Senha"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError(false);
            }}
          />
          {error && <span className="hint" style={{ color: 'var(--pitzi-danger)' }}>Senha incorreta.</span>}
        </div>
        <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }} type="submit">
          Entrar
        </button>
      </form>
    </div>
  );
}
