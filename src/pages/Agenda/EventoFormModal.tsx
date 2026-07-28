import { useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import { todayISO } from '../../lib/businessDays';
import type { EventoAgenda, Processo, TipoEvento } from '../../data/types';

interface Props {
  processos: Processo[];
  defaultDate?: string;
  onClose: () => void;
  onSaved: () => void;
}

export function EventoFormModal({ processos, defaultDate, onClose, onSaved }: Props) {
  const [titulo, setTitulo] = useState('');
  const [tipo, setTipo] = useState<TipoEvento>('reuniao');
  const [data, setData] = useState(defaultDate ?? todayISO());
  const [hora, setHora] = useState('10:00');
  const [local, setLocal] = useState('');
  const [processoId, setProcessoId] = useState('');

  async function handleSave() {
    if (!titulo.trim()) return;
    const evento: EventoAgenda = {
      id: newId(),
      titulo: titulo.trim(),
      tipo,
      data,
      hora,
      local: local.trim() || undefined,
      processoId: processoId || undefined,
    };
    await repos.eventos.create(evento);
    onSaved();
  }

  return (
    <Modal
      title="Novo evento na agenda"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar evento
          </button>
        </>
      }
    >
      <div className="field">
        <label>Título</label>
        <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Ex.: Reunião com Viseu Advogados" />
      </div>
      <div className="form-row">
        <div className="field">
          <label>Tipo</label>
          <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value as TipoEvento)}>
            <option value="reuniao">Reunião</option>
            <option value="audiencia">Audiência</option>
            <option value="outro">Outro</option>
          </select>
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
      </div>
      <div className="form-row">
        <div className="field">
          <label>Data</label>
          <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
        </div>
        <div className="field">
          <label>Hora</label>
          <input className="input" type="time" value={hora} onChange={(e) => setHora(e.target.value)} />
        </div>
      </div>
      <div className="field">
        <label>Local</label>
        <input className="input" value={local} onChange={(e) => setLocal(e.target.value)} placeholder="Ex.: 3ª Vara Cível — TJSP" />
      </div>
    </Modal>
  );
}
