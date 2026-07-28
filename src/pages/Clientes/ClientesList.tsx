import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { EmptyState } from '../../components/ui/EmptyState';
import { ClienteFormModal } from './ClienteFormModal';

export function ClientesList() {
  const navigate = useNavigate();
  const { items: clientes } = useCollection(repos.clientes);
  const { items: processos } = useCollection(repos.processos);
  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState('');

  const filtered = clientes.filter((c) => c.nome.toLowerCase().includes(busca.toLowerCase()));

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Clientes</h2>
          <p className="desc">{clientes.length} cliente(s)/reclamante(s) cadastrado(s).</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Novo cliente
        </button>
      </div>

      <div className="filters-bar">
        <input className="input" placeholder="Buscar por nome…" value={busca} onChange={(e) => setBusca(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon="👤" title="Nenhum cliente encontrado" description="Cadastre o primeiro cliente/reclamante." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Contato</th>
                <th>Canal de aquisição</th>
                <th>Processos vinculados</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} onClick={() => navigate(`/clientes/${c.id}`)}>
                  <td>
                    <strong>{c.nome}</strong>
                  </td>
                  <td>
                    {c.telefone && <div>{c.telefone}</div>}
                    {c.email && <div className="text-muted text-sm">{c.email}</div>}
                  </td>
                  <td>{c.canalAquisicao ?? '—'}</td>
                  <td>{processos.filter((p) => p.clienteId === c.id).length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && <ClienteFormModal onClose={() => setShowModal(false)} />}
    </div>
  );
}
