import { useMemo, useState } from 'react';
import { Plus, Trash2, CalendarPlus, AlarmClockPlus } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { useConfig } from '../../hooks/useConfig';
import { formatDateBR } from '../../lib/businessDays';
import { EmptyState } from '../../components/ui/EmptyState';
import { PrazoFormModal } from '../Prazos/PrazoFormModal';
import { IntimacaoFormModal } from './IntimacaoFormModal';
import type { Intimacao } from '../../data/types';

interface PrazoModalState {
  intimacao: Intimacao;
  criarEvento: boolean;
}

export function Intimacoes() {
  const { items: intimacoes, reload } = useCollection(repos.intimacoes);
  const { items: processos } = useCollection(repos.processos);
  const { items: escritorios } = useCollection(repos.escritorios);
  const { items: prazos } = useCollection(repos.prazos);
  const { config } = useConfig();

  const [showForm, setShowForm] = useState(false);
  const [prazoModal, setPrazoModal] = useState<PrazoModalState | null>(null);
  const [fTipo, setFTipo] = useState('');
  const [fTribunal, setFTribunal] = useState('');
  const [fProcesso, setFProcesso] = useState('');

  const processoById = useMemo(() => new Map(processos.map((p) => [p.id, p])), [processos]);
  const prazoById = useMemo(() => new Map(prazos.map((p) => [p.id, p])), [prazos]);

  const tipos = useMemo(() => Array.from(new Set(intimacoes.map((i) => i.tipoAcao))), [intimacoes]);
  const tribunais = useMemo(
    () => Array.from(new Set(intimacoes.map((i) => i.tribunalVara).filter(Boolean))) as string[],
    [intimacoes],
  );

  const filtered = intimacoes
    .filter((i) => {
      if (fTipo && i.tipoAcao !== fTipo) return false;
      if (fTribunal && i.tribunalVara !== fTribunal) return false;
      if (fProcesso && i.processoId !== fProcesso) return false;
      return true;
    })
    .slice()
    .sort((a, b) => b.recebidoEm.localeCompare(a.recebidoEm));

  function processoLabel(processoId?: string): string {
    if (!processoId) return '—';
    const proc = processoById.get(processoId);
    if (!proc) return '—';
    return proc.numeroCNJ || proc.tribunalVara || proc.tipoDemanda;
  }

  async function excluir(i: Intimacao) {
    await repos.intimacoes.softDelete(i.id);
    reload();
  }

  async function handlePrazoCreated(intimacao: Intimacao, prazoId: string) {
    await repos.intimacoes.update(intimacao.id, { prazoSugeridoId: prazoId });
    reload();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Intimações</h2>
          <p className="desc">Registre intimações recebidas e converta rapidamente em prazos e eventos de agenda.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(true)}>
          <Plus size={15} /> Nova intimação
        </button>
      </div>

      {intimacoes.length > 1 && (
        <div className="filters-bar">
          <select className="select" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
            <option value="">Todos os tipos de ação</option>
            {tipos.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select className="select" value={fTribunal} onChange={(e) => setFTribunal(e.target.value)}>
            <option value="">Todos os tribunais</option>
            {tribunais.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
          <select className="select" value={fProcesso} onChange={(e) => setFProcesso(e.target.value)}>
            <option value="">Todos os processos</option>
            {processos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.numeroCNJ || p.tribunalVara || p.tipoDemanda}
              </option>
            ))}
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          icon="📨"
          title="Nenhuma intimação cadastrada"
          description="Registre a primeira intimação recebida para começar a organizar prazos e eventos."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tipo de ação</th>
                <th>Tribunal/Vara</th>
                <th>Recebido em</th>
                <th>Processo</th>
                <th>Resumo</th>
                <th>Prazo sugerido</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((i) => {
                const prazo = i.prazoSugeridoId ? prazoById.get(i.prazoSugeridoId) : undefined;
                return (
                  <tr key={i.id} style={{ cursor: 'default' }}>
                    <td>{i.tipoAcao}</td>
                    <td>{i.tribunalVara || '—'}</td>
                    <td>{formatDateBR(i.recebidoEm)}</td>
                    <td>{processoLabel(i.processoId)}</td>
                    <td style={{ maxWidth: 240 }}>{i.resumo || '—'}</td>
                    <td>
                      {prazo ? (
                        <span className="badge badge-neutral">Vence {formatDateBR(prazo.dataVencimento)}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setPrazoModal({ intimacao: i, criarEvento: false })}
                        >
                          <AlarmClockPlus size={13} /> Prazo
                        </button>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => setPrazoModal({ intimacao: i, criarEvento: true })}
                        >
                          <CalendarPlus size={13} /> Prazo + Agenda
                        </button>
                        <button className="icon-btn" onClick={() => excluir(i)} aria-label="Excluir">
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showForm && config && (
        <IntimacaoFormModal
          processos={processos}
          config={config}
          onClose={() => setShowForm(false)}
          onSaved={() => {
            setShowForm(false);
            reload();
          }}
        />
      )}

      {prazoModal && config && (
        <PrazoFormModal
          processos={processos}
          escritorios={escritorios}
          config={config}
          initialProcessoId={prazoModal.intimacao.processoId}
          initialTipo={prazoModal.intimacao.tipoAcao}
          initialCriarEvento={prazoModal.criarEvento}
          onCreated={(prazo) => handlePrazoCreated(prazoModal.intimacao, prazo.id)}
          onClose={() => setPrazoModal(null)}
          onSaved={() => {
            setPrazoModal(null);
            reload();
          }}
        />
      )}
    </div>
  );
}
