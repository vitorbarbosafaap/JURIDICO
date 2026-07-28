import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import type { EstagioParceria, ParceriaCRM, Seguradora } from '../../data/types';

interface Props {
  seguradoras: Seguradora[];
  onClose: () => void;
  onSaved: () => void;
}

const ESTAGIOS: EstagioParceria[] = ['Prospecção', 'Em negociação', 'Ativo', 'Em revisão', 'Encerrado'];

export function ParceriaFormModal({ seguradoras, onClose, onSaved }: Props) {
  const [parceiro, setParceiro] = useState('');
  const [seguradoraId, setSeguradoraId] = useState('');
  const [estagio, setEstagio] = useState<EstagioParceria>('Prospecção');
  const [responsavelInterno, setResponsavelInterno] = useState('');
  const [observacoes, setObservacoes] = useState('');

  async function handleSave() {
    if (!parceiro.trim()) return;
    const now = new Date().toISOString();
    const parceria: ParceriaCRM = {
      id: newId(),
      parceiro: parceiro.trim(),
      seguradoraId: seguradoraId || undefined,
      estagio,
      responsavelInterno: responsavelInterno.trim() || undefined,
      observacoes: observacoes.trim() || undefined,
      contatos: [],
      createdAt: now,
      updatedAt: now,
    };
    await repos.parceriasCRM.create(parceria);
    onSaved();
  }

  return (
    <Modal
      title="Nova parceria"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar parceria
          </button>
        </>
      }
    >
      <div className="field">
        <label>Parceiro</label>
        <input
          className="input"
          value={parceiro}
          onChange={(e) => setParceiro(e.target.value)}
          placeholder="Ex.: Seguradora XPTO ou parceiro comercial"
        />
      </div>

      <div className="field">
        <label>Seguradora vinculada (opcional)</label>
        <select className="select" value={seguradoraId} onChange={(e) => setSeguradoraId(e.target.value)}>
          <option value="">Sem vínculo</option>
          {seguradoras.map((s) => (
            <option key={s.id} value={s.id}>
              {s.nome}
            </option>
          ))}
        </select>
      </div>

      <div className="form-row">
        <div className="field">
          <label>Estágio</label>
          <select className="select" value={estagio} onChange={(e) => setEstagio(e.target.value as EstagioParceria)}>
            {ESTAGIOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Responsável interno</label>
          <input
            className="input"
            value={responsavelInterno}
            onChange={(e) => setResponsavelInterno(e.target.value)}
            placeholder="Ex.: Vitor Barbosa"
          />
        </div>
      </div>

      <div className="field">
        <label>Observações</label>
        <textarea
          className="textarea"
          value={observacoes}
          onChange={(e) => setObservacoes(e.target.value)}
          rows={3}
        />
      </div>
    </Modal>
  );
}
