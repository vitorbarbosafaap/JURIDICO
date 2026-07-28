import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { currencyBRL } from '../Dashboard/selectors';
import { ProcessoFormModal } from './ProcessoFormModal';

export function ProcessosList() {
  const navigate = useNavigate();
  const { items: processos } = useCollection(repos.processos);
  const { items: clientes } = useCollection(repos.clientes);
  const { items: escritorios } = useCollection(repos.escritorios);
  const { items: seguradoras } = useCollection(repos.seguradoras);

  const [showModal, setShowModal] = useState(false);
  const [busca, setBusca] = useState('');
  const [fStatus, setFStatus] = useState('');
  const [fTipo, setFTipo] = useState('');
  const [fEscritorio, setFEscritorio] = useState('');

  const clienteById = useMemo(() => new Map(clientes.map((c) => [c.id, c])), [clientes]);
  const escritorioById = useMemo(() => new Map(escritorios.map((e) => [e.id, e])), [escritorios]);

  const filtered = processos.filter((p) => {
    if (fStatus && p.status !== fStatus) return false;
    if (fTipo && p.tipoDemanda !== fTipo) return false;
    if (fEscritorio && p.escritorioResponsavelId !== fEscritorio) return false;
    if (busca) {
      const cliente = p.clienteId ? clienteById.get(p.clienteId)?.nome ?? '' : '';
      const haystack = `${p.numeroCNJ ?? ''} ${p.tribunalVara ?? ''} ${cliente}`.toLowerCase();
      if (!haystack.includes(busca.toLowerCase())) return false;
    }
    return true;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Processos</h2>
          <p className="desc">{processos.length} processo(s) cadastrado(s).</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          <Plus size={15} /> Novo processo
        </button>
      </div>

      <div className="filters-bar">
        <input
          className="input"
          style={{ minWidth: 220 }}
          placeholder="Buscar por CNJ, tribunal ou cliente…"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
        />
        <select className="select" value={fStatus} onChange={(e) => setFStatus(e.target.value)}>
          <option value="">Todos os status</option>
          <option>Novo</option>
          <option>Aguardando subsídio</option>
          <option>Em defesa</option>
          <option>Aguardando audiência</option>
          <option>Concluído</option>
        </select>
        <select className="select" value={fTipo} onChange={(e) => setFTipo(e.target.value)}>
          <option value="">Todos os tipos</option>
          <option>Judicial</option>
          <option>JEC</option>
          <option>PROCON</option>
          <option>Sinistro</option>
        </select>
        <select className="select" value={fEscritorio} onChange={(e) => setFEscritorio(e.target.value)}>
          <option value="">Todos os escritórios</option>
          {escritorios.map((e) => (
            <option key={e.id} value={e.id}>
              {e.nome}
            </option>
          ))}
        </select>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon="📁"
          title="Nenhum processo encontrado"
          description="Ajuste os filtros ou cadastre um novo processo."
        />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Processo</th>
                <th>Cliente</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Contingência</th>
                <th>Escritório</th>
                <th>Valor da causa</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.id} onClick={() => navigate(`/processos/${p.id}`)}>
                  <td>
                    <strong>{p.numeroCNJ || '—'}</strong>
                    <div className="text-muted text-sm">{p.tribunalVara}</div>
                  </td>
                  <td>{p.clienteId ? clienteById.get(p.clienteId)?.nome ?? '—' : '—'}</td>
                  <td>{p.tipoDemanda}</td>
                  <td>
                    <Badge variant={p.status === 'Concluído' ? 'ok' : 'neutral'}>{p.status}</Badge>
                  </td>
                  <td>
                    <Badge variant={p.contingencia === 'Provável' ? 'warn' : 'neutral'}>{p.contingencia}</Badge>
                  </td>
                  <td>{p.escritorioResponsavelId ? escritorioById.get(p.escritorioResponsavelId)?.nome ?? '—' : '—'}</td>
                  <td>{currencyBRL(p.valorCausa ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <ProcessoFormModal
          clientes={clientes}
          escritorios={escritorios}
          seguradoras={seguradoras}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
}
