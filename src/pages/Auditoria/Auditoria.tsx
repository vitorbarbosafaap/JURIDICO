import { useEffect, useState } from 'react';
import { listGlobalAudit } from '../../data/db';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import type { GlobalAuditEntry } from '../../data/types';

const COLLECTION_LABEL: Record<string, string> = {
  processos: 'Processo',
  clientes: 'Cliente',
  escritorios: 'Escritório',
  seguradoras: 'Seguradora',
  prazos: 'Prazo',
  eventos: 'Evento de agenda',
  intimacoes: 'Intimação',
  cartasRecusa: 'Carta de recusa',
  subsidiosGerados: 'Subsídio gerado',
  atas: 'Ata de reunião',
  pagamentosEscritorio: 'Pagamento a escritório',
  condenacoes: 'Condenação judicial',
  parceriasCRM: 'Parceria CRM',
};

const ACAO_VARIANT: Record<GlobalAuditEntry['acao'], 'neutral' | 'accent' | 'warn' | 'ok'> = {
  criação: 'accent',
  atualização: 'neutral',
  exclusão: 'warn',
  restauração: 'ok',
};

export function Auditoria() {
  const [entries, setEntries] = useState<GlobalAuditEntry[] | null>(null);
  const [fColecao, setFColecao] = useState('');
  const [fAcao, setFAcao] = useState('');

  useEffect(() => {
    listGlobalAudit().then(setEntries);
  }, []);

  if (!entries) return <p className="text-muted">Carregando…</p>;

  const colecoes = Array.from(new Set(entries.map((e) => e.colecao)));
  const filtered = entries.filter((e) => {
    if (fColecao && e.colecao !== fColecao) return false;
    if (fAcao && e.acao !== fAcao) return false;
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Auditoria</h2>
          <p className="desc">Trilha completa de criações, alterações, exclusões e restaurações em todo o sistema.</p>
        </div>
      </div>

      {entries.length > 0 && (
        <div className="filters-bar">
          <select className="select" value={fColecao} onChange={(e) => setFColecao(e.target.value)}>
            <option value="">Todos os tipos</option>
            {colecoes.map((c) => (
              <option key={c} value={c}>
                {COLLECTION_LABEL[c] ?? c}
              </option>
            ))}
          </select>
          <select className="select" value={fAcao} onChange={(e) => setFAcao(e.target.value)}>
            <option value="">Todas as ações</option>
            <option value="criação">Criação</option>
            <option value="atualização">Atualização</option>
            <option value="exclusão">Exclusão</option>
            <option value="restauração">Restauração</option>
          </select>
        </div>
      )}

      {filtered.length === 0 ? (
        <EmptyState icon="🧾" title="Nenhum registro de auditoria" description="As alterações feitas no sistema aparecerão aqui." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Quando</th>
                <th>Tipo</th>
                <th>Item</th>
                <th>Ação</th>
                <th>Autor</th>
              </tr>
            </thead>
            <tbody>
              {filtered.slice(0, 500).map((e) => (
                <tr key={e.id} style={{ cursor: 'default' }}>
                  <td className="text-sm">{new Date(e.at).toLocaleString('pt-BR')}</td>
                  <td>{COLLECTION_LABEL[e.colecao] ?? e.colecao}</td>
                  <td>{e.entidadeLabel}</td>
                  <td>
                    <Badge variant={ACAO_VARIANT[e.acao]}>{e.acao}</Badge>
                  </td>
                  <td>{e.autor}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length > 500 && (
            <p className="text-muted text-sm" style={{ padding: '10px 16px' }}>
              Mostrando os 500 registros mais recentes de {filtered.length}.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
