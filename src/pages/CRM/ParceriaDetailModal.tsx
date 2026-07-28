import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../../components/ui/Modal';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import type { EstagioParceria, ParceriaCRM, Seguradora } from '../../data/types';

interface Props {
  parceria: ParceriaCRM;
  seguradoras: Seguradora[];
  onClose: () => void;
  onChanged: () => void;
}

const ESTAGIOS: EstagioParceria[] = ['Prospecção', 'Em negociação', 'Ativo', 'Em revisão', 'Encerrado'];

export function ParceriaDetailModal({ parceria, seguradoras, onClose, onChanged }: Props) {
  const [resumo, setResumo] = useState('');

  async function patch(fields: Partial<ParceriaCRM>) {
    await repos.parceriasCRM.update(parceria.id, { ...fields, updatedAt: new Date().toISOString() });
    onChanged();
  }

  async function registrarContato() {
    if (!resumo.trim()) return;
    await patch({
      contatos: [...parceria.contatos, { id: newId(), at: new Date().toISOString(), resumo: resumo.trim() }],
    });
    setResumo('');
  }

  async function excluir() {
    await repos.parceriasCRM.softDelete(parceria.id);
    onClose();
    onChanged();
  }

  return (
    <Modal
      title={parceria.parceiro}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-danger" onClick={excluir}>
            <Trash2 size={15} /> Excluir parceria
          </button>
          <button className="btn btn-ghost" onClick={onClose}>
            Fechar
          </button>
        </>
      }
    >
      <div className="form-row">
        <div className="field">
          <label>Estágio</label>
          <select
            className="select"
            value={parceria.estagio}
            onChange={(e) => patch({ estagio: e.target.value as EstagioParceria })}
          >
            {ESTAGIOS.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Seguradora vinculada</label>
          <select
            className="select"
            value={parceria.seguradoraId ?? ''}
            onChange={(e) => patch({ seguradoraId: e.target.value || undefined })}
          >
            <option value="">Sem vínculo</option>
            {seguradoras.map((s) => (
              <option key={s.id} value={s.id}>
                {s.nome}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label>Responsável interno</label>
        <input
          className="input"
          defaultValue={parceria.responsavelInterno}
          onBlur={(e) =>
            e.target.value !== parceria.responsavelInterno &&
            patch({ responsavelInterno: e.target.value || undefined })
          }
        />
      </div>

      <div className="field">
        <label>Observações</label>
        <textarea
          className="textarea"
          rows={3}
          defaultValue={parceria.observacoes}
          onBlur={(e) =>
            e.target.value !== parceria.observacoes && patch({ observacoes: e.target.value || undefined })
          }
        />
      </div>

      <div className="card-title" style={{ marginTop: 8, marginBottom: 10 }}>
        Histórico de contatos
      </div>
      <div className="stack">
        {parceria.contatos.length === 0 && <p className="text-muted text-sm">Nenhum contato registrado ainda.</p>}
        {parceria.contatos
          .slice()
          .reverse()
          .map((c) => (
            <div className="card card-pad" key={c.id}>
              <div className="text-muted text-sm">{new Date(c.at).toLocaleString('pt-BR')}</div>
              <p style={{ marginTop: 4 }}>{c.resumo}</p>
            </div>
          ))}
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Novo contato</label>
          <textarea
            className="textarea"
            rows={2}
            value={resumo}
            onChange={(e) => setResumo(e.target.value)}
            placeholder="Ex.: Reunião de alinhamento sobre renovação do acordo…"
          />
        </div>
        <button className="btn btn-primary" style={{ alignSelf: 'flex-start' }} onClick={registrarContato}>
          Registrar contato
        </button>
      </div>
    </Modal>
  );
}
