import { useEffect, useState } from 'react';
import { RotateCcw, Trash2 } from 'lucide-react';
import { repos } from '../../data/db';
import { useConfig } from '../../hooks/useConfig';
import { EmptyState } from '../../components/ui/EmptyState';

interface TrashRow {
  id: string;
  colecao: string;
  label: string;
  deletedAt: string;
  restore: () => Promise<void>;
  hardDelete: () => Promise<void>;
}

const COLLECTION_LABEL: Record<string, string> = {
  processos: 'Processo',
  clientes: 'Cliente',
  escritorios: 'Escritório',
  seguradoras: 'Seguradora',
  prazos: 'Prazo',
  eventos: 'Evento de agenda',
};

function itemLabel(colecao: string, item: any): string {
  switch (colecao) {
    case 'processos':
      return item.numeroCNJ || item.tribunalVara || `Processo ${item.tipoDemanda}`;
    case 'clientes':
      return item.nome;
    case 'escritorios':
      return item.nome;
    case 'seguradoras':
      return item.nome;
    case 'prazos':
      return item.tipo;
    case 'eventos':
      return item.titulo;
    default:
      return item.id;
  }
}

export function Exclusoes() {
  const { config } = useConfig();
  const [rows, setRows] = useState<TrashRow[]>([]);

  async function load() {
    const all: TrashRow[] = [];
    for (const [colecao, repo] of Object.entries(repos)) {
      const deleted = await repo.listDeleted();
      for (const item of deleted) {
        all.push({
          id: item.id,
          colecao,
          label: itemLabel(colecao, item),
          deletedAt: item.deletedAt!,
          restore: async () => {
            await repo.restore(item.id);
            load();
          },
          hardDelete: async () => {
            await repo.hardDelete(item.id);
            load();
          },
        });
      }
    }
    all.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
    setRows(all);
  }

  useEffect(() => {
    load();
    const unsubs = Object.values(repos).map((r) => r.subscribe(load));
    return () => unsubs.forEach((u) => u());
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Exclusões</h2>
          <p className="desc">
            Itens excluídos ficam recuperáveis por {config?.retencaoLixeiraDias ?? 30} dias antes da exclusão
            definitiva.
          </p>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState icon="🗑️" title="Lixeira vazia" description="Nenhum item excluído no momento." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Item</th>
                <th>Tipo</th>
                <th>Excluído em</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={`${r.colecao}-${r.id}`} style={{ cursor: 'default' }}>
                  <td>{r.label}</td>
                  <td>{COLLECTION_LABEL[r.colecao] ?? r.colecao}</td>
                  <td>{new Date(r.deletedAt).toLocaleString('pt-BR')}</td>
                  <td>
                    <div className="row">
                      <button className="btn btn-ghost btn-sm" onClick={r.restore}>
                        <RotateCcw size={13} /> Restaurar
                      </button>
                      <button className="icon-btn" onClick={r.hardDelete} aria-label="Excluir definitivamente">
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
