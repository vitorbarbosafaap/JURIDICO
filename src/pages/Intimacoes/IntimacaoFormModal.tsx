import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import { todayISO } from '../../lib/businessDays';
import type { AppConfig, Intimacao, Processo } from '../../data/types';

interface Props {
  processos: Processo[];
  config: AppConfig;
  onClose: () => void;
  onSaved: () => void;
}

export function IntimacaoFormModal({ processos, config, onClose, onSaved }: Props) {
  const [tipoAcao, setTipoAcao] = useState('');
  const [tribunalVara, setTribunalVara] = useState('');
  const [recebidoEm, setRecebidoEm] = useState(todayISO());
  const [processoId, setProcessoId] = useState('');
  const [resumo, setResumo] = useState('');

  async function handleSave() {
    if (!tipoAcao.trim()) return;
    const intimacao: Intimacao = {
      id: newId(),
      tipoAcao: tipoAcao.trim(),
      tribunalVara: tribunalVara.trim() || undefined,
      recebidoEm,
      processoId: processoId || undefined,
      resumo: resumo.trim() || undefined,
    };
    await repos.intimacoes.create(intimacao);
    onSaved();
  }

  return (
    <Modal
      title="Nova intimação"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar intimação
          </button>
        </>
      }
    >
      <div className="field">
        <label>Tipo de ação</label>
        <input
          className="input"
          list="tipos-acao-sugestoes"
          value={tipoAcao}
          onChange={(e) => setTipoAcao(e.target.value)}
          placeholder="Ex.: Agravo de Instrumento"
        />
        <datalist id="tipos-acao-sugestoes">
          {config.tiposPeca.map((t) => (
            <option key={t.id} value={t.tipo} />
          ))}
        </datalist>
      </div>

      <div className="form-row">
        <div className="field">
          <label>Tribunal/Vara</label>
          <input
            className="input"
            value={tribunalVara}
            onChange={(e) => setTribunalVara(e.target.value)}
            placeholder="Ex.: 3ª Vara Cível"
          />
        </div>
        <div className="field">
          <label>Data de recebimento</label>
          <input className="input" type="date" value={recebidoEm} onChange={(e) => setRecebidoEm(e.target.value)} />
        </div>
      </div>

      <div className="field">
        <label>Processo vinculado (opcional)</label>
        <select className="select" value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
          <option value="">Sem vínculo</option>
          {processos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.numeroCNJ || p.tribunalVara || p.tipoDemanda} — {p.tipoDemanda}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label>Resumo</label>
        <textarea
          className="textarea"
          value={resumo}
          onChange={(e) => setResumo(e.target.value)}
          placeholder="Breve descrição do conteúdo da intimação"
        />
      </div>
    </Modal>
  );
}
