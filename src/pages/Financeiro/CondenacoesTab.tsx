import { useState } from 'react';
import { Plus } from 'lucide-react';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import { useCollection } from '../../hooks/useCollection';
import { formatDateBR } from '../../lib/businessDays';
import { currencyBRL } from '../Dashboard/selectors';
import { EmptyState } from '../../components/ui/EmptyState';
import { isComputedLate } from './selectors';
import type { CondenacaoJudicial, StatusPagamento } from '../../data/types';

const STATUS_LABEL: Record<StatusPagamento, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  pago: 'Pago',
  atrasado: 'Atrasado',
};

export function CondenacoesTab() {
  const { items: condenacoes, reload } = useCollection(repos.condenacoes);
  const { items: processos } = useCollection(repos.processos);

  const [processoId, setProcessoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState(0);
  const [prazoPagamento, setPrazoPagamento] = useState('');
  const [comprovanteUrl, setComprovanteUrl] = useState('');

  const processoById = new Map(processos.map((p) => [p.id, p]));

  async function add() {
    if (!processoId || !descricao.trim() || !prazoPagamento) return;
    const condenacao: CondenacaoJudicial = {
      id: newId(),
      processoId,
      descricao: descricao.trim(),
      valor,
      prazoPagamento,
      status: 'pendente',
      comprovanteUrl: comprovanteUrl.trim() || undefined,
      createdAt: new Date().toISOString(),
    };
    await repos.condenacoes.create(condenacao);
    setProcessoId('');
    setDescricao('');
    setValor(0);
    setPrazoPagamento('');
    setComprovanteUrl('');
    reload();
  }

  async function updateStatus(id: string, status: StatusPagamento) {
    await repos.condenacoes.update(id, { status });
    reload();
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Processo</label>
            <select className="select" value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
              <option value="">Selecione...</option>
              {processos.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.numeroCNJ || p.tribunalVara || p.tipoDemanda} — {p.tipoDemanda}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Descrição</label>
            <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Valor (R$)</label>
            <input className="input" type="number" value={valor} onChange={(e) => setValor(Number(e.target.value))} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Prazo de pagamento</label>
            <input
              className="input"
              type="date"
              value={prazoPagamento}
              onChange={(e) => setPrazoPagamento(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Comprovante (URL, opcional)</label>
            <input
              className="input"
              value={comprovanteUrl}
              onChange={(e) => setComprovanteUrl(e.target.value)}
              placeholder="Link do comprovante"
            />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={add}>
              <Plus size={15} /> Adicionar condenação
            </button>
          </div>
        </div>
      </div>

      {condenacoes.length === 0 ? (
        <EmptyState
          icon="⚖️"
          title="Nenhuma condenação cadastrada"
          description="Lance condenações judiciais vinculadas a processos acima."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Processo</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Prazo de pagamento</th>
                <th>Comprovante</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {condenacoes.map((c) => {
                const proc = processoById.get(c.processoId);
                const late = isComputedLate(c.status, c.prazoPagamento);
                return (
                  <tr key={c.id} style={{ cursor: 'default' }}>
                    <td>{proc ? proc.numeroCNJ || proc.tribunalVara || proc.tipoDemanda : '—'}</td>
                    <td>{c.descricao}</td>
                    <td>{currencyBRL(c.valor)}</td>
                    <td>{formatDateBR(c.prazoPagamento)}</td>
                    <td>
                      {c.comprovanteUrl ? (
                        <a href={c.comprovanteUrl} target="_blank" rel="noreferrer">
                          Ver
                        </a>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <select
                          className="select"
                          value={c.status}
                          onChange={(e) => updateStatus(c.id, e.target.value as StatusPagamento)}
                        >
                          {(Object.keys(STATUS_LABEL) as StatusPagamento[]).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                        {late && <span className="badge badge-vencido">Atraso</span>}
                        {!late && c.status === 'pago' && <span className="badge badge-cumprido">Pago</span>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
