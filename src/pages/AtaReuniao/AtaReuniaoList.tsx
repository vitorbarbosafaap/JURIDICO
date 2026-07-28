import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { EmptyState } from '../../components/ui/EmptyState';
import { formatDateBR } from '../../lib/businessDays';
import { AtaFormModal } from './AtaFormModal';

export function AtaReuniaoList() {
  const navigate = useNavigate();
  const { items: atas } = useCollection(repos.atas);
  const { items: processos } = useCollection(repos.processos);
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState('');

  const filtered = atas.filter((a) => a.titulo.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Atas de reunião</h2>
          <p className="desc">{atas.length} ata(s) registrada(s).</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Nova ata
        </button>
      </div>

      <div className="filters-bar">
        <input className="input" placeholder="Buscar por título…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="📝" title="Nenhuma ata encontrada" description="Registre a primeira ata de reunião." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Título</th>
                <th>Data</th>
                <th>Participantes</th>
                <th>Ações pendentes</th>
                <th>Ações concluídas</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const pendentes = a.acoes.filter((ac) => !ac.concluida).length;
                const concluidas = a.acoes.filter((ac) => ac.concluida).length;
                return (
                  <tr key={a.id} onClick={() => navigate(`/ata/${a.id}`)}>
                    <td>
                      <strong>{a.titulo}</strong>
                    </td>
                    <td>{formatDateBR(a.data)}</td>
                    <td>{a.participantes.length}</td>
                    <td>{pendentes}</td>
                    <td>{concluidas}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <AtaFormModal processos={processos} onClose={() => setShowModal(false)} />}
    </div>
  );
}
