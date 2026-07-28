import { useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { EmptyState } from '../../components/ui/EmptyState';
import { ParceriaFormModal } from './ParceriaFormModal';
import { ParceriaDetailModal } from './ParceriaDetailModal';
import type { EstagioParceria, ParceriaCRM } from '../../data/types';

const COLUMNS: EstagioParceria[] = ['Prospecção', 'Em negociação', 'Ativo', 'Em revisão', 'Encerrado'];

export function CRM() {
  const { items: parcerias, reload } = useCollection(repos.parceriasCRM);
  const { items: seguradoras } = useCollection(repos.seguradoras);

  const [showModal, setShowModal] = useState(false);
  const [selected, setSelected] = useState<ParceriaCRM | null>(null);

  const seguradoraById = useMemo(() => new Map(seguradoras.map((s) => [s.id, s])), [seguradoras]);

  function ParceriaCard({ p }: { p: ParceriaCRM }) {
    const seguradora = p.seguradoraId ? seguradoraById.get(p.seguradoraId) : undefined;
    return (
      <div className="kanban-card" onClick={() => setSelected(p)}>
        <div className="tipo">{p.parceiro}</div>
        <div className="meta">
          <span>{seguradora ? `Seguradora: ${seguradora.nome}` : 'Sem seguradora vinculada'}</span>
          <span>Responsável: {p.responsavelInterno || '—'}</span>
          <span>{p.contatos.length} contato(s) registrado(s)</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>CRM (Captação)</h2>
          <p className="desc">Relacionamento institucional com seguradoras e parceiros comerciais.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nova parceria
        </button>
      </div>

      {parcerias.length === 0 ? (
        <EmptyState
          icon="🤝"
          title="Nenhuma parceria cadastrada"
          description="Registre a primeira parceria para começar a acompanhar a captação."
        />
      ) : (
        <div className="kanban">
          {COLUMNS.map((estagio) => {
            const colItems = parcerias.filter((p) => p.estagio === estagio);
            return (
              <div className="kanban-col" key={estagio}>
                <div className="kanban-col-header">
                  <span className="kanban-col-title">{estagio}</span>
                  <span className="kanban-count">{colItems.length}</span>
                </div>
                {colItems.map((p) => (
                  <ParceriaCard key={p.id} p={p} />
                ))}
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <ParceriaFormModal
          seguradoras={seguradoras}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            reload();
          }}
        />
      )}

      {selected && (
        <ParceriaDetailModal
          parceria={parcerias.find((p) => p.id === selected.id) ?? selected}
          seguradoras={seguradoras}
          onClose={() => setSelected(null)}
          onChanged={reload}
        />
      )}
    </div>
  );
}
