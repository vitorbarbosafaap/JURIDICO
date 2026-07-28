import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { Badge } from '../../components/ui/Badge';
import type { Cliente } from '../../data/types';

export function ClienteDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [cliente, setCliente] = useState<Cliente | null | undefined>(undefined);
  const { items: processos } = useCollection(repos.processos);

  useEffect(() => {
    if (!id) return;
    repos.clientes.get(id).then((c) => setCliente(c ?? null));
    return repos.clientes.subscribe(() => repos.clientes.get(id).then((c) => setCliente(c ?? null)));
  }, [id]);

  if (cliente === undefined) return <p className="text-muted">Carregando…</p>;
  if (cliente === null) {
    return (
      <div>
        <p>Cliente não encontrado.</p>
        <button className="btn btn-ghost" onClick={() => navigate('/clientes')}>
          Voltar
        </button>
      </div>
    );
  }

  async function patch(fields: Partial<Cliente>) {
    if (!cliente) return;
    await repos.clientes.update(cliente.id, fields);
  }

  const processosDoCliente = processos.filter((p) => p.clienteId === cliente.id);

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/clientes')}>
        <ArrowLeft size={14} /> Voltar para Clientes
      </button>

      <div className="page-header">
        <div>
          <h2>{cliente.nome}</h2>
          <p className="desc">Cliente desde {new Date(cliente.createdAt).toLocaleDateString('pt-BR')}</p>
        </div>
        <button
          className="btn btn-danger"
          onClick={async () => {
            await repos.clientes.softDelete(cliente.id);
            navigate('/clientes');
          }}
        >
          <Trash2 size={15} /> Excluir
        </button>
      </div>

      <div className="grid-2">
        <div className="card card-pad">
          <div className="card-title" style={{ marginBottom: 12 }}>
            Dados de contato
          </div>
          <div className="form-row">
            <div className="field">
              <label>CPF</label>
              <input className="input" defaultValue={cliente.cpf} onBlur={(e) => patch({ cpf: e.target.value })} />
            </div>
            <div className="field">
              <label>Telefone</label>
              <input className="input" defaultValue={cliente.telefone} onBlur={(e) => patch({ telefone: e.target.value })} />
            </div>
          </div>
          <div className="field">
            <label>E-mail</label>
            <input className="input" defaultValue={cliente.email} onBlur={(e) => patch({ email: e.target.value })} />
          </div>
          <div className="field">
            <label>Histórico de sinistros</label>
            <textarea
              className="textarea"
              rows={4}
              defaultValue={cliente.historicoSinistros}
              onBlur={(e) => patch({ historicoSinistros: e.target.value })}
            />
          </div>
        </div>

        <div className="card card-pad">
          <div className="card-title" style={{ marginBottom: 12 }}>
            Processos vinculados
          </div>
          {processosDoCliente.length === 0 ? (
            <p className="text-muted text-sm">Nenhum processo vinculado a este cliente.</p>
          ) : (
            <div className="stack">
              {processosDoCliente.map((p) => (
                <div
                  key={p.id}
                  className="row"
                  style={{ justifyContent: 'space-between', cursor: 'pointer' }}
                  onClick={() => navigate(`/processos/${p.id}`)}
                >
                  <span>{p.numeroCNJ || p.tribunalVara || p.tipoDemanda}</span>
                  <Badge variant={p.status === 'Concluído' ? 'ok' : 'neutral'}>{p.status}</Badge>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
