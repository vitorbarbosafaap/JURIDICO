import { useState } from 'react';
import { clearPassword, hasPasswordConfigured, setPassword } from '../../auth/passwordAuth';

export function SegurancaTab() {
  const [configured, setConfigured] = useState(hasPasswordConfigured());
  const [senha, setSenha] = useState('');
  const [confirmacao, setConfirmacao] = useState('');
  const [msg, setMsg] = useState('');

  async function handleSalvar() {
    if (senha.length < 4) {
      setMsg('A senha deve ter ao menos 4 caracteres.');
      return;
    }
    if (senha !== confirmacao) {
      setMsg('As senhas não coincidem.');
      return;
    }
    await setPassword(senha);
    setConfigured(true);
    setSenha('');
    setConfirmacao('');
    setMsg('Senha configurada. Ela será exigida na próxima vez que o sistema for aberto.');
  }

  function handleRemover() {
    clearPassword();
    setConfigured(false);
    setMsg('Senha removida — o sistema abrirá sem tela de bloqueio.');
  }

  return (
    <div className="stack">
      <p className="text-muted text-sm">
        Camada simples de proteção para uso em máquina compartilhada: uma senha local, armazenada apenas
        neste navegador (nunca enviada a nenhum servidor). Ao usar o backend Firebase, o login com Google
        substitui esta senha.
      </p>

      <div className="card card-pad">
        <div className="text-muted text-sm" style={{ marginBottom: 12 }}>
          Status atual: <strong>{configured ? 'Senha configurada' : 'Sem senha (acesso livre)'}</strong>
        </div>

        <div className="form-row">
          <div className="field">
            <label>Nova senha</label>
            <input className="input" type="password" value={senha} onChange={(e) => setSenha(e.target.value)} />
          </div>
          <div className="field">
            <label>Confirmar senha</label>
            <input className="input" type="password" value={confirmacao} onChange={(e) => setConfirmacao(e.target.value)} />
          </div>
        </div>

        <div className="row">
          <button className="btn btn-primary" onClick={handleSalvar}>
            {configured ? 'Alterar senha' : 'Definir senha'}
          </button>
          {configured && (
            <button className="btn btn-danger" onClick={handleRemover}>
              Remover senha
            </button>
          )}
        </div>

        {msg && (
          <p className="text-sm" style={{ marginTop: 12, color: 'var(--pitzi-accent-dark)' }}>
            {msg}
          </p>
        )}
      </div>
    </div>
  );
}
