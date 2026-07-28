import { useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { getBackendSettings, saveBackendSettings } from '../../data/backendSettings';
import { GoogleSheetsAdapter } from '../../data/adapters/googleSheetsAdapter';
import type { BackendSettings, StorageBackendKind } from '../../data/types';

const BACKEND_LABEL: Record<StorageBackendKind, string> = {
  local: 'Local (localStorage)',
  'google-sheets': 'Google Sheets (Apps Script)',
  firebase: 'Firebase (Firestore + Google OAuth)',
};

export function IntegracaoDadosTab() {
  const [settings, setSettings] = useState<BackendSettings>(getBackendSettings());
  const [testResult, setTestResult] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [saved, setSaved] = useState(false);

  function update(patch: Partial<BackendSettings>) {
    setSettings((s) => ({ ...s, ...patch }));
    setTestResult('idle');
    setSaved(false);
  }

  async function testarConexao() {
    setTestResult('testing');
    try {
      if (settings.active === 'google-sheets') {
        if (!settings.googleSheets?.webAppUrl) throw new Error('Informe a URL do Web App.');
        await new GoogleSheetsAdapter(settings.googleSheets).ping();
      } else if (settings.active === 'firebase') {
        if (!settings.firebase?.projectId) throw new Error('Preencha os dados do projeto Firebase.');
        const { FirebaseAdapter } = await import('../../data/adapters/firebaseAdapter');
        await new FirebaseAdapter(settings.firebase).ping();
      }
      setTestResult('ok');
      setTestMessage('Conexão bem-sucedida.');
    } catch (err) {
      setTestResult('fail');
      setTestMessage(err instanceof Error ? err.message : 'Falha ao conectar.');
    }
  }

  function salvarERecarregar() {
    saveBackendSettings(settings);
    window.location.reload();
  }

  return (
    <div className="stack">
      <p className="text-muted text-sm">
        Por padrão os dados ficam salvos apenas neste navegador. Configure aqui um backend compartilhado —
        Google Sheets (reaproveitando a planilha mestre existente) ou Firebase (sincronização em tempo real
        com login Google) — para acessar os mesmos dados em qualquer dispositivo. Trocar o backend recarrega
        a aplicação.
      </p>

      <div className="card card-pad">
        <div className="field">
          <label>Backend ativo</label>
          <select
            className="select"
            value={settings.active}
            onChange={(e) => update({ active: e.target.value as StorageBackendKind })}
          >
            {(Object.keys(BACKEND_LABEL) as StorageBackendKind[]).map((k) => (
              <option key={k} value={k}>
                {BACKEND_LABEL[k]}
              </option>
            ))}
          </select>
        </div>

        {settings.active === 'google-sheets' && (
          <>
            <div className="field">
              <label>Web App URL (Apps Script)</label>
              <input
                className="input"
                placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                value={settings.googleSheets?.webAppUrl ?? ''}
                onChange={(e) => update({ googleSheets: { ...settings.googleSheets, webAppUrl: e.target.value } })}
              />
              <span className="hint">
                Deploy do script em <code>docs/apps-script/Code.gs</code> — veja as instruções no topo do arquivo.
              </span>
            </div>
            <div className="field">
              <label>Chave de API (opcional, recomendado)</label>
              <input
                className="input"
                value={settings.googleSheets?.apiKey ?? ''}
                onChange={(e) =>
                  update({ googleSheets: { webAppUrl: settings.googleSheets?.webAppUrl ?? '', apiKey: e.target.value } })
                }
              />
            </div>
          </>
        )}

        {settings.active === 'firebase' && (
          <>
            <div className="form-row">
              <div className="field">
                <label>API Key</label>
                <input
                  className="input"
                  value={settings.firebase?.apiKey ?? ''}
                  onChange={(e) => update({ firebase: { ...settings.firebase!, apiKey: e.target.value } })}
                />
              </div>
              <div className="field">
                <label>Auth Domain</label>
                <input
                  className="input"
                  placeholder="seu-projeto.firebaseapp.com"
                  value={settings.firebase?.authDomain ?? ''}
                  onChange={(e) => update({ firebase: { ...settings.firebase!, authDomain: e.target.value } })}
                />
              </div>
            </div>
            <div className="form-row">
              <div className="field">
                <label>Project ID</label>
                <input
                  className="input"
                  value={settings.firebase?.projectId ?? ''}
                  onChange={(e) => update({ firebase: { ...settings.firebase!, projectId: e.target.value } })}
                />
              </div>
              <div className="field">
                <label>App ID</label>
                <input
                  className="input"
                  value={settings.firebase?.appId ?? ''}
                  onChange={(e) => update({ firebase: { ...settings.firebase!, appId: e.target.value } })}
                />
              </div>
            </div>
            <p className="hint">
              Ative o provedor "Google" em Authentication → Sign-in method no console do Firebase para o
              login funcionar.
            </p>
          </>
        )}

        {settings.active !== 'local' && (
          <div className="row" style={{ marginTop: 4, marginBottom: 14 }}>
            <button className="btn btn-ghost btn-sm" onClick={testarConexao} disabled={testResult === 'testing'}>
              {testResult === 'testing' ? 'Testando…' : 'Testar conexão'}
            </button>
            {testResult === 'ok' && (
              <span className="row" style={{ color: 'var(--pitzi-ok)', fontSize: 12.5 }}>
                <CheckCircle2 size={15} /> {testMessage}
              </span>
            )}
            {testResult === 'fail' && (
              <span className="row" style={{ color: 'var(--pitzi-danger)', fontSize: 12.5 }}>
                <XCircle size={15} /> {testMessage}
              </span>
            )}
          </div>
        )}

        <button className="btn btn-primary" onClick={salvarERecarregar}>
          Salvar e recarregar aplicação
        </button>
        {saved && <span className="hint" style={{ marginLeft: 10 }}>Salvo.</span>}
      </div>
    </div>
  );
}
