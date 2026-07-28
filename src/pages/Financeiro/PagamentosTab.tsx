import { useState } from 'react';
import { Plus } from 'lucide-react';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import { useCollection } from '../../hooks/useCollection';
import { formatDateBR } from '../../lib/businessDays';
import { currencyBRL } from '../Dashboard/selectors';
import { EmptyState } from '../../components/ui/EmptyState';
import { isComputedLate } from './selectors';
import type { PagamentoEscritorio, StatusPagamento } from '../../data/types';

const TIPOS: PagamentoEscritorio['tipo'][] = ['honorarios', 'exito', 'reembolso', 'outro'];
const TIPO_LABEL: Record<PagamentoEscritorio['tipo'], string> = {
  honorarios: 'Honorários',
  exito: 'Êxito',
  reembolso: 'Reembolso',
  outro: 'Outro',
};
const STATUS_LABEL: Record<StatusPagamento, string> = {
  pendente: 'Pendente',
  aprovado: 'Aprovado',
  pago: 'Pago',
  atrasado: 'Atrasado',
};

export function PagamentosTab() {
  const { items: pagamentos, reload } = useCollection(repos.pagamentosEscritorio);
  const { items: escritorios } = useCollection(repos.escritorios);
  const { items: processos } = useCollection(repos.processos);

  const [escritorioId, setEscritorioId] = useState('');
  const [processoId, setProcessoId] = useState('');
  const [descricao, setDescricao] = useState('');
  const [tipo, setTipo] = useState<PagamentoEscritorio['tipo']>('honorarios');
  const [valor, setValor] = useState(0);
  const [notaFiscal, setNotaFiscal] = useState('');
  const [vencimento, setVencimento] = useState('');

  const escritoriosExternos = escritorios.filter((e) => e.tipo === 'externo');
  const escritorioById = new Map(escritorios.map((e) => [e.id, e]));
  const processoById = new Map(processos.map((p) => [p.id, p]));

  async function add() {
    if (!escritorioId || !descricao.trim() || !vencimento) return;
    const pagamento: PagamentoEscritorio = {
      id: newId(),
      escritorioId,
      processoId: processoId || undefined,
      descricao: descricao.trim(),
      tipo,
      valor,
      notaFiscal: notaFiscal.trim() || undefined,
      vencimento,
      status: 'pendente',
      createdAt: new Date().toISOString(),
    };
    await repos.pagamentosEscritorio.create(pagamento);
    setEscritorioId('');
    setProcessoId('');
    setDescricao('');
    setTipo('honorarios');
    setValor(0);
    setNotaFiscal('');
    setVencimento('');
    reload();
  }

  async function updateStatus(id: string, status: StatusPagamento) {
    await repos.pagamentosEscritorio.update(id, {
      status,
      pagoEm: status === 'pago' ? new Date().toISOString() : undefined,
    });
    reload();
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Escritório</label>
            <select className="select" value={escritorioId} onChange={(e) => setEscritorioId(e.target.value)}>
              <option value="">Selecione...</option>
              {escritoriosExternos.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
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
        </div>

        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Descrição</label>
            <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Tipo</label>
            <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value as PagamentoEscritorio['tipo'])}>
              {TIPOS.map((t) => (
                <option key={t} value={t}>
                  {TIPO_LABEL[t]}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Valor (R$)</label>
            <input className="input" type="number" value={valor} onChange={(e) => setValor(Number(e.target.value))} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Nota fiscal (opcional)</label>
            <input className="input" value={notaFiscal} onChange={(e) => setNotaFiscal(e.target.value)} placeholder="Nº da NF" />
          </div>
        </div>

        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Vencimento</label>
            <input className="input" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={add}>
              <Plus size={15} /> Adicionar pagamento
            </button>
          </div>
        </div>
      </div>

      {pagamentos.length === 0 ? (
        <EmptyState
          icon="💸"
          title="Nenhum pagamento cadastrado"
          description="Lance honorários, êxito e reembolsos de escritórios externos acima."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Escritório</th>
                <th>Processo</th>
                <th>Descrição</th>
                <th>Tipo</th>
                <th>Valor</th>
                <th>Nota Fiscal</th>
                <th>Vencimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {pagamentos.map((p) => {
                const proc = p.processoId ? processoById.get(p.processoId) : undefined;
                const late = isComputedLate(p.status, p.vencimento);
                return (
                  <tr key={p.id} style={{ cursor: 'default' }}>
                    <td>{escritorioById.get(p.escritorioId)?.nome ?? '—'}</td>
                    <td>{proc ? proc.numeroCNJ || proc.tribunalVara || proc.tipoDemanda : '—'}</td>
                    <td>{p.descricao}</td>
                    <td>{TIPO_LABEL[p.tipo]}</td>
                    <td>{currencyBRL(p.valor)}</td>
                    <td>{p.notaFiscal || '—'}</td>
                    <td>{formatDateBR(p.vencimento)}</td>
                    <td>
                      <div className="row" style={{ gap: 6 }}>
                        <select
                          className="select"
                          value={p.status}
                          onChange={(e) => updateStatus(p.id, e.target.value as StatusPagamento)}
                        >
                          {(Object.keys(STATUS_LABEL) as StatusPagamento[]).map((s) => (
                            <option key={s} value={s}>
                              {STATUS_LABEL[s]}
                            </option>
                          ))}
                        </select>
                        {late && <span className="badge badge-vencido">Atraso</span>}
                        {!late && p.status === 'pago' && <span className="badge badge-cumprido">Pago</span>}
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
