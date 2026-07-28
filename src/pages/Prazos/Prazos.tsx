import { useMemo, useState } from 'react';
import { Plus, Check, Trash2, LayoutGrid, List as ListIcon } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { useConfig } from '../../hooks/useConfig';
import { classifyUrgency, formatDateBR } from '../../lib/businessDays';
import { UrgencyBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { PrazoFormModal } from './PrazoFormModal';
import type { Prazo, UrgencyBucket } from '../../data/types';

const COLUMNS: UrgencyBucket[] = ['vencido', 'hoje', 'semana', 'quinzena', 'sem-urgencia', 'cumprido'];

export function Prazos() {
  const { items: prazos, reload } = useCollection(repos.prazos);
  const { items: processos } = useCollection(repos.processos);
  const { items: escritorios } = useCollection(repos.escritorios);
  const { config } = useConfig();

  const [view, setView] = useState<'kanban' | 'lista'>('kanban');
  const [showModal, setShowModal] = useState(false);
  const [fEscritorio, setFEscritorio] = useState('');
  const [fTribunal, setFTribunal] = useState('');
  const [fTipo, setFTipo] = useState('');

  const processoById = useMemo(() => new Map(processos.map((p) => [p.id, p])), [processos]);
  const escritorioById = useMemo(() => new Map(escritorios.map((e) => [e.id, e])), [escritorios]);

  const tribunais = useMemo(
    () => Array.from(new Set(processos.map((p) => p.tribunalVara).filter(Boolean))) as string[],
    [processos],
  );
  const tipos = useMemo(() => Array.from(new Set(prazos.map((p) => p.tipo))), [prazos]);

  const filtered = prazos.filter((p) => {
    if (fEscritorio && p.responsavel !== fEscritorio) return false;
    if (fTipo && p.tipo !== fTipo) return false;
    if (fTribunal) {
      const proc = p.processoId ? processoById.get(p.processoId) : undefined;
      if (proc?.tribunalVara !== fTribunal) return false;
    }
    return true;
  });

  function responsavelLabel(p: Prazo): string {
    if (p.responsavel === 'interno') return 'Interno';
    return escritorioById.get(p.responsavel)?.nome ?? 'Externo';
  }

  async function marcarCumprido(p: Prazo) {
    await repos.prazos.update(p.id, { status: 'cumprido', cumpridoEm: new Date().toISOString() });
    reload();
  }

  async function excluir(p: Prazo) {
    await repos.prazos.softDelete(p.id);
    reload();
  }

  function PrazoCard({ p }: { p: Prazo }) {
    const proc = p.processoId ? processoById.get(p.processoId) : undefined;
    return (
      <div className="kanban-card">
        <div className="tipo">{p.tipo}</div>
        <div className="meta">
          <span>{proc ? proc.numeroCNJ || proc.tribunalVara || proc.tipoDemanda : 'Sem processo vinculado'}</span>
          <span>Responsável: {responsavelLabel(p)}</span>
          <span>Vence: {formatDateBR(p.dataVencimento)}</span>
        </div>
        {p.status === 'pendente' && (
          <div className="row" style={{ marginTop: 8, gap: 6 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => marcarCumprido(p)}>
              <Check size={13} /> Cumprido
            </button>
            <button className="icon-btn" onClick={() => excluir(p)} aria-label="Excluir">
              <Trash2 size={13} />
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Prazos</h2>
          <p className="desc">Cálculo automático em dias úteis, considerando feriados forenses.</p>
        </div>
        <div className="row">
          <div className="calendar-view-toggle">
            <button className={view === 'kanban' ? 'active' : ''} onClick={() => setView('kanban')}>
              <LayoutGrid size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
              Kanban
            </button>
            <button className={view === 'lista' ? 'active' : ''} onClick={() => setView('lista')}>
              <ListIcon size={13} style={{ marginRight: 4, verticalAlign: -2 }} />
              Lista
            </button>
          </div>
          <button className="btn btn-primary" onClick={() => setShowModal(true)}>
            <Plus size={15} /> Novo prazo
          </button>
        </div>
      </div>

      <div className="filters-bar">
        <select className="select" value={fEscritorio} onChange={(e) => setFEscritorio(e.target.value)}>
          <option value="">Todos os responsáveis</option>
          <option value="interno">Interno</option>
          {escritorios
            .filter((e) => e.tipo === 'externo')
            .map((e) => (
              <option key={e.id} value={e.id}>
                {e.nome}
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
        <select className="select" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          {tipos.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="⏱️" title="Nenhum prazo cadastrado" description="Crie o primeiro prazo para começar a organizar a rotina do escritório." />
      ) : view === 'kanban' ? (
        <div className="kanban">
          {COLUMNS.map((bucket) => {
            const colItems = filtered.filter((p) => classifyUrgency(p.dataVencimento, p.status) === bucket);
            return (
              <div className="kanban-col" key={bucket}>
                <div className="kanban-col-header">
                  <span className="kanban-col-title">
                    <UrgencyBadge bucket={bucket} />
                  </span>
                  <span className="kanban-count">{colItems.length}</span>
                </div>
                {colItems.map((p) => (
                  <PrazoCard key={p.id} p={p} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Tipo</th>
                <th>Processo</th>
                <th>Responsável</th>
                <th>Vencimento</th>
                <th>Urgência</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {filtered
                .slice()
                .sort((a, b) => a.dataVencimento.localeCompare(b.dataVencimento))
                .map((p) => {
                  const proc = p.processoId ? processoById.get(p.processoId) : undefined;
                  const bucket = classifyUrgency(p.dataVencimento, p.status);
                  return (
                    <tr key={p.id} style={{ cursor: 'default' }}>
                      <td>{p.tipo}</td>
                      <td>{proc ? proc.numeroCNJ || proc.tribunalVara || proc.tipoDemanda : '—'}</td>
                      <td>{responsavelLabel(p)}</td>
                      <td>{formatDateBR(p.dataVencimento)}</td>
                      <td>
                        <UrgencyBadge bucket={bucket} />
                      </td>
                      <td>
                        {p.status === 'pendente' && (
                          <div className="row">
                            <button className="btn btn-ghost btn-sm" onClick={() => marcarCumprido(p)}>
                              <Check size={13} /> Cumprido
                            </button>
                            <button className="icon-btn" onClick={() => excluir(p)}>
                              <Trash2 size={13} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && config && (
        <PrazoFormModal
          processos={processos}
          escritorios={escritorios}
          config={config}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
