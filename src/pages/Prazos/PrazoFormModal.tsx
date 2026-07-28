import { useMemo, useState } from 'react';
import { Modal } from '../../components/ui/Modal';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import { addBusinessDays, buildHolidaySet, todayISO } from '../../lib/businessDays';
import type { AppConfig, Escritorio, Prazo, Processo } from '../../data/types';

interface Props {
  processos: Processo[];
  escritorios: Escritorio[];
  config: AppConfig;
  onClose: () => void;
  onSaved: () => void;
  initialProcessoId?: string;
}

export function PrazoFormModal({ processos, escritorios, config, onClose, onSaved, initialProcessoId }: Props) {
  const [processoId, setProcessoId] = useState(initialProcessoId ?? '');
  const [tipo, setTipo] = useState(config.tiposPeca[0]?.tipo ?? '');
  const [dias, setDias] = useState(config.tiposPeca[0]?.diasUteis ?? 10);
  const [dataBase, setDataBase] = useState(todayISO());
  const [responsavel, setResponsavel] = useState<string>('interno');
  const [criarEvento, setCriarEvento] = useState(true);

  const holidays = useMemo(
    () => buildHolidaySet(config.feriadosCustom, [new Date().getFullYear(), new Date().getFullYear() + 1]),
    [config.feriadosCustom],
  );
  const dataVencimento = useMemo(() => addBusinessDays(dataBase, dias, holidays), [dataBase, dias, holidays]);

  function handleTipoChange(novoTipo: string) {
    setTipo(novoTipo);
    const cfg = config.tiposPeca.find((t) => t.tipo === novoTipo);
    if (cfg) setDias(cfg.diasUteis);
  }

  async function handleSave() {
    if (!tipo.trim()) return;
    const prazo: Prazo = {
      id: newId(),
      processoId: processoId || undefined,
      tipo,
      prazoDiasUteis: dias,
      dataBase,
      dataVencimento,
      responsavel,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    };
    await repos.prazos.create(prazo);

    if (criarEvento) {
      await repos.eventos.create({
        id: newId(),
        titulo: `Prazo: ${tipo}`,
        tipo: 'prazo',
        data: dataVencimento,
        processoId: processoId || undefined,
        prazoId: prazo.id,
      });
    }
    onSaved();
  }

  return (
    <Modal
      title="Novo prazo"
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onClose}>
            Cancelar
          </button>
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar prazo
          </button>
        </>
      }
    >
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
        <label>Tipo de prazo / peça</label>
        <select className="select" value={tipo} onChange={(e) => handleTipoChange(e.target.value)}>
          {config.tiposPeca.map((t) => (
            <option key={t.id} value={t.tipo}>
              {t.tipo} ({t.diasUteis}d úteis)
            </option>
          ))}
          <option value={tipo}>{tipo && !config.tiposPeca.some((t) => t.tipo === tipo) ? tipo : 'Outro (digitar abaixo)'}</option>
        </select>
        <input
          className="input"
          style={{ marginTop: 6 }}
          placeholder="Ou digite um tipo personalizado"
          value={tipo}
          onChange={(e) => setTipo(e.target.value)}
        />
      </div>

      <div className="form-row">
        <div className="field">
          <label>Data base</label>
          <input className="input" type="date" value={dataBase} onChange={(e) => setDataBase(e.target.value)} />
        </div>
        <div className="field">
          <label>Prazo (dias úteis)</label>
          <input
            className="input"
            type="number"
            min={0}
            value={dias}
            onChange={(e) => setDias(Number(e.target.value))}
          />
        </div>
      </div>

      <div className="field">
        <label>Responsável</label>
        <select className="select" value={responsavel} onChange={(e) => setResponsavel(e.target.value)}>
          <option value="interno">Interno</option>
          {escritorios
            .filter((e) => e.tipo === 'externo')
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
              </option>
            ))}
        </select>
      </div>

      <div className="card card-pad" style={{ background: '#f8fafc', marginBottom: 14 }}>
        <div className="text-muted text-sm">Vencimento calculado (dias úteis, feriados excluídos)</div>
        <div style={{ fontSize: 18, fontWeight: 800 }}>
          {new Date(dataVencimento + 'T00:00:00').toLocaleDateString('pt-BR')}
        </div>
      </div>

      <label className="row" style={{ fontSize: 13, fontWeight: 600 }}>
        <input type="checkbox" checked={criarEvento} onChange={(e) => setCriarEvento(e.target.checked)} />
        Também criar evento na Agenda (+ Prazo + Agenda)
      </label>
    </Modal>
  );
}
