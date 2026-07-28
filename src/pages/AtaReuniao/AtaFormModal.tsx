import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import { todayISO } from '../../lib/businessDays';
import type { AtaReuniao, Processo } from '../../data/types';

function parseParticipantes(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function AtaFormModal({ processos, onClose }: { processos: Processo[]; onClose: () => void }) {
  const [titulo, setTitulo] = useState('');
  const [data, setData] = useState(todayISO());
  const [participantesRaw, setParticipantesRaw] = useState('');
  const [pauta, setPauta] = useState('');
  const [decisoes, setDecisoes] = useState('');
  const [processoId, setProcessoId] = useState('');

  async function handleSave() {
    if (!titulo.trim()) return;
    const ata: AtaReuniao = {
      id: newId(),
      titulo: titulo.trim(),
      data,
      participantes: parseParticipantes(participantesRaw),
      pauta: pauta.trim(),
      decisoes: decisoes.trim(),
      acoes: [],
      processoId: processoId || undefined,
      createdAt: new Date().toISOString(),
    };
    await repos.atas.create(ata);
    onClose();
  }

  return (
    <Modal
      title="Nova ata de reunião"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar ata
          </button>
        </>
      }
    >
      <div className="form-row">
        <div className="field">
          <label>Título</label>
          <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
        </div>
        <div className="field">
          <label>Data</label>
          <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Participantes (um por linha ou separados por vírgula)</label>
        <textarea
          className="textarea"
          rows={3}
          value={participantesRaw}
          onChange={(e) => setParticipantesRaw(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Pauta</label>
        <textarea className="textarea" rows={3} value={pauta} onChange={(e) => setPauta(e.target.value)} />
      </div>
      <div className="field">
        <label>Decisões</label>
        <textarea className="textarea" rows={3} value={decisoes} onChange={(e) => setDecisoes(e.target.value)} />
      </div>
      <div className="field">
        <label>Processo vinculado (opcional)</label>
        <select className="select" value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
          <option value="">Sem vínculo</option>
          {processos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.numeroCNJ || p.tribunalVara || p.tipoDemanda}
            </option>
          ))}
        </select>
      </div>
    </Modal>
  );
}
