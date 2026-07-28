import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2 } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { newId } from '../../data/repository';
import { Tabs } from '../../components/ui/Tabs';
import { formatDateBR } from '../../lib/businessDays';
import { currencyBRL } from '../Dashboard/selectors';
import { UrgencyBadge } from '../../components/ui/Badge';
import { classifyUrgency } from '../../lib/businessDays';
import { PrazoFormModal } from '../Prazos/PrazoFormModal';
import { useConfig } from '../../hooks/useConfig';
import type {
  CanalVenda,
  Contingencia,
  DocumentoRef,
  LancamentoFinanceiro,
  Processo,
  StatusProcesso,
  TipoDemanda,
} from '../../data/types';

const TABS = ['Visão Geral', 'Documentos', 'Prazos', 'Comunicações', 'Financeiro', 'Auditoria'];

export function ProcessoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [processo, setProcesso] = useState<Processo | null | undefined>(undefined);
  const [tab, setTab] = useState(TABS[0]);

  const { items: clientes } = useCollection(repos.clientes);
  const { items: escritorios } = useCollection(repos.escritorios);
  const { items: seguradoras } = useCollection(repos.seguradoras);
  const { items: prazos, reload: reloadPrazos } = useCollection(repos.prazos);
  const { config } = useConfig();
  const [showPrazoModal, setShowPrazoModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    repos.processos.get(id).then((p) => setProcesso(p ?? null));
    return repos.processos.subscribe(() => repos.processos.get(id).then((p) => setProcesso(p ?? null)));
  }, [id]);

  if (processo === undefined) return <p className="text-muted">Carregando…</p>;
  if (processo === null) {
    return (
      <div>
        <p>Processo não encontrado.</p>
        <button className="btn btn-ghost" onClick={() => navigate('/processos')}>
          Voltar
        </button>
      </div>
    );
  }

  async function patch(fields: Partial<Processo>, acao: string) {
    if (!processo) return;
    const audit = { id: newId(), at: new Date().toISOString(), autor: 'Você', acao };
    await repos.processos.update(processo.id, {
      ...fields,
      updatedAt: new Date().toISOString(),
      auditoria: [...processo.auditoria, audit],
    });
  }

  const cliente = clientes.find((c) => c.id === processo.clienteId);
  const prazosDoProcesso = prazos.filter((p) => p.processoId === processo.id);

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/processos')}>
        <ArrowLeft size={14} /> Voltar para Processos
      </button>

      <div className="page-header">
        <div>
          <h2>{processo.numeroCNJ || 'Processo sem número CNJ'}</h2>
          <p className="desc">
            {processo.tribunalVara || 'Tribunal não informado'} · {cliente?.nome ?? 'Sem cliente vinculado'}
          </p>
        </div>
        <button
          className="btn btn-danger"
          onClick={async () => {
            await repos.processos.softDelete(processo.id);
            navigate('/processos');
          }}
        >
          <Trash2 size={15} /> Excluir
        </button>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Visão Geral' && (
        <div className="card card-pad">
          <div className="form-row">
            <div className="field">
              <label>Número CNJ</label>
              <input
                className="input"
                defaultValue={processo.numeroCNJ}
                onBlur={(e) => e.target.value !== processo.numeroCNJ && patch({ numeroCNJ: e.target.value }, 'Editou número CNJ')}
              />
            </div>
            <div className="field">
              <label>Tribunal / Vara</label>
              <input
                className="input"
                defaultValue={processo.tribunalVara}
                onBlur={(e) => e.target.value !== processo.tribunalVara && patch({ tribunalVara: e.target.value }, 'Editou tribunal/vara')}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Tipo de demanda</label>
              <select
                className="select"
                value={processo.tipoDemanda}
                onChange={(e) => patch({ tipoDemanda: e.target.value as TipoDemanda }, 'Alterou tipo de demanda')}
              >
                <option>Judicial</option>
                <option>JEC</option>
                <option>PROCON</option>
                <option>Sinistro</option>
              </select>
            </div>
            <div className="field">
              <label>Status</label>
              <select
                className="select"
                value={processo.status}
                onChange={(e) => patch({ status: e.target.value as StatusProcesso }, `Alterou status para "${e.target.value}"`)}
              >
                <option>Novo</option>
                <option>Aguardando subsídio</option>
                <option>Em defesa</option>
                <option>Aguardando audiência</option>
                <option>Concluído</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Cliente / reclamante</label>
            <select
              className="select"
              value={processo.clienteId ?? ''}
              onChange={(e) => patch({ clienteId: e.target.value || undefined }, 'Alterou cliente vinculado')}
            >
              <option value="">Selecionar cliente</option>
              {clientes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nome}
                </option>
              ))}
            </select>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Contingência</label>
              <select
                className="select"
                value={processo.contingencia}
                onChange={(e) => patch({ contingencia: e.target.value as Contingencia }, 'Alterou contingência')}
              >
                <option>Provável</option>
                <option>Possível</option>
                <option>Remota</option>
              </select>
            </div>
            <div className="field">
              <label>Valor da causa / provisão (R$)</label>
              <input
                className="input"
                type="number"
                defaultValue={processo.valorCausa}
                onBlur={(e) => patch({ valorCausa: Number(e.target.value) }, 'Alterou valor da causa')}
              />
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Escritório responsável</label>
              <select
                className="select"
                value={processo.escritorioResponsavelId ?? ''}
                onChange={(e) => patch({ escritorioResponsavelId: e.target.value || undefined }, 'Alterou escritório responsável')}
              >
                <option value="">Selecionar</option>
                {escritorios.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.nome}
                  </option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Seguradora / parceiro</label>
              <select
                className="select"
                value={processo.seguradoraId ?? ''}
                onChange={(e) => patch({ seguradoraId: e.target.value || undefined }, 'Alterou seguradora vinculada')}
              >
                <option value="">Nenhuma</option>
                {seguradoras.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="field">
              <label>Canal de venda</label>
              <select
                className="select"
                value={processo.canalVenda ?? 'Direto'}
                onChange={(e) => patch({ canalVenda: e.target.value as CanalVenda }, 'Alterou canal de venda')}
              >
                <option>Amazon</option>
                <option>Gazin</option>
                <option>PagBank</option>
                <option>Direto</option>
                <option>Outro</option>
              </select>
            </div>
            <div className="field">
              <label>Produto</label>
              <input
                className="input"
                defaultValue={processo.produto}
                onBlur={(e) => e.target.value !== processo.produto && patch({ produto: e.target.value }, 'Editou produto')}
              />
            </div>
          </div>

          <div className="card-title" style={{ marginTop: 8, marginBottom: 10 }}>
            Linha do tempo
          </div>
          <TimelineEditor processo={processo} onAdd={(texto) => patch(
            { timeline: [...processo.timeline, { id: newId(), at: new Date().toISOString(), texto }] },
            'Adicionou evento na linha do tempo',
          )} />
        </div>
      )}

      {tab === 'Documentos' && (
        <DocumentosTab processo={processo} onPatch={patch} />
      )}

      {tab === 'Prazos' && (
        <div>
          <button className="btn btn-primary" style={{ marginBottom: 14 }} onClick={() => setShowPrazoModal(true)}>
            <Plus size={15} /> Novo prazo neste processo
          </button>
          {prazosDoProcesso.length === 0 ? (
            <p className="text-muted text-sm">Nenhum prazo vinculado a este processo.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Tipo</th>
                    <th>Vencimento</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {prazosDoProcesso.map((p) => (
                    <tr key={p.id} style={{ cursor: 'default' }}>
                      <td>{p.tipo}</td>
                      <td>{formatDateBR(p.dataVencimento)}</td>
                      <td>
                        <UrgencyBadge bucket={classifyUrgency(p.dataVencimento, p.status)} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {showPrazoModal && config && (
            <PrazoFormModal
              processos={[processo]}
              escritorios={escritorios}
              config={config}
              initialProcessoId={processo.id}
              onClose={() => setShowPrazoModal(false)}
              onSaved={() => {
                setShowPrazoModal(false);
                reloadPrazos();
              }}
            />
          )}
        </div>
      )}

      {tab === 'Comunicações' && <ComunicacoesTab processo={processo} onPatch={patch} />}

      {tab === 'Financeiro' && <FinanceiroTab processo={processo} onPatch={patch} />}

      {tab === 'Auditoria' && (
        <div className="stack">
          {processo.auditoria
            .slice()
            .reverse()
            .map((a) => (
              <div className="card card-pad" key={a.id}>
                <div className="row" style={{ justifyContent: 'space-between' }}>
                  <strong>{a.acao}</strong>
                  <span className="text-muted text-sm">{new Date(a.at).toLocaleString('pt-BR')}</span>
                </div>
                <div className="text-muted text-sm">{a.autor}</div>
                {a.detalhe && <p className="text-sm">{a.detalhe}</p>}
              </div>
            ))}
        </div>
      )}
    </div>
  );
}

function TimelineEditor({ processo, onAdd }: { processo: Processo; onAdd: (texto: string) => void }) {
  const [texto, setTexto] = useState('');
  return (
    <div className="stack">
      {processo.timeline
        .slice()
        .reverse()
        .map((t) => (
          <div key={t.id} className="row" style={{ gap: 10, fontSize: 13 }}>
            <span className="text-muted" style={{ minWidth: 90 }}>
              {new Date(t.at).toLocaleDateString('pt-BR')}
            </span>
            <span>{t.texto}</span>
          </div>
        ))}
      <div className="row">
        <input className="input" placeholder="Nova movimentação…" value={texto} onChange={(e) => setTexto(e.target.value)} />
        <button
          className="btn btn-ghost btn-sm"
          onClick={() => {
            if (!texto.trim()) return;
            onAdd(texto.trim());
            setTexto('');
          }}
        >
          + Adicionar
        </button>
      </div>
    </div>
  );
}

function DocumentosTab({
  processo,
  onPatch,
}: {
  processo: Processo;
  onPatch: (fields: Partial<Processo>, acao: string) => void;
}) {
  const [titulo, setTitulo] = useState('');
  const [url, setUrl] = useState('');

  function add() {
    if (!titulo.trim() || !url.trim()) return;
    const doc: DocumentoRef = { id: newId(), titulo: titulo.trim(), url: url.trim(), adicionadoEm: new Date().toISOString() };
    onPatch({ documentos: [...processo.documentos, doc] }, `Anexou documento "${doc.titulo}"`);
    setTitulo('');
    setUrl('');
  }

  function remove(docId: string) {
    onPatch({ documentos: processo.documentos.filter((d) => d.id !== docId) }, 'Removeu documento');
  }

  return (
    <div className="stack">
      <p className="text-muted text-sm">
        Documentos ficam referenciados por link (Google Drive, etc.) — o GitHub Pages não hospeda
        arquivos binários pesados.
      </p>
      <div className="card card-pad">
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Título</label>
            <input className="input" value={titulo} onChange={(e) => setTitulo(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Link (Drive, etc.)</label>
            <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://drive.google.com/…" />
          </div>
        </div>
        <button className="btn btn-primary" onClick={add}>
          <Plus size={15} /> Anexar documento
        </button>
      </div>
      {processo.documentos.length === 0 ? (
        <p className="text-muted text-sm">Nenhum documento anexado.</p>
      ) : (
        processo.documentos.map((d) => (
          <div className="card card-pad row" style={{ justifyContent: 'space-between' }} key={d.id}>
            <a href={d.url} target="_blank" rel="noreferrer" style={{ color: 'var(--pitzi-accent-dark)', fontWeight: 600 }}>
              {d.titulo}
            </a>
            <button className="icon-btn" onClick={() => remove(d.id)}>
              <Trash2 size={15} />
            </button>
          </div>
        ))
      )}
    </div>
  );
}

function ComunicacoesTab({
  processo,
  onPatch,
}: {
  processo: Processo;
  onPatch: (fields: Partial<Processo>, acao: string) => void;
}) {
  const [canal, setCanal] = useState<'email' | 'telefone' | 'reuniao' | 'sistema'>('email');
  const [resumo, setResumo] = useState('');

  function add() {
    if (!resumo.trim()) return;
    onPatch(
      {
        comunicacoes: [
          ...processo.comunicacoes,
          { id: newId(), at: new Date().toISOString(), canal, resumo: resumo.trim() },
        ],
      },
      'Registrou comunicação',
    );
    setResumo('');
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Canal</label>
            <select className="select" value={canal} onChange={(e) => setCanal(e.target.value as typeof canal)}>
              <option value="email">E-mail</option>
              <option value="telefone">Telefone</option>
              <option value="reuniao">Reunião</option>
              <option value="sistema">Sistema</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Resumo</label>
            <input className="input" value={resumo} onChange={(e) => setResumo(e.target.value)} />
          </div>
        </div>
        <button className="btn btn-primary" onClick={add}>
          <Plus size={15} /> Registrar comunicação
        </button>
      </div>
      {processo.comunicacoes
        .slice()
        .reverse()
        .map((c) => (
          <div className="card card-pad" key={c.id}>
            <div className="row" style={{ justifyContent: 'space-between' }}>
              <span className="badge badge-neutral">{c.canal}</span>
              <span className="text-muted text-sm">{new Date(c.at).toLocaleString('pt-BR')}</span>
            </div>
            <p style={{ marginTop: 6 }}>{c.resumo}</p>
          </div>
        ))}
    </div>
  );
}

function FinanceiroTab({
  processo,
  onPatch,
}: {
  processo: Processo;
  onPatch: (fields: Partial<Processo>, acao: string) => void;
}) {
  const [descricao, setDescricao] = useState('');
  const [valor, setValor] = useState(0);
  const [vencimento, setVencimento] = useState('');

  function add() {
    if (!descricao.trim() || !vencimento) return;
    const lanc: LancamentoFinanceiro = { id: newId(), descricao: descricao.trim(), valor, vencimento, status: 'pendente' };
    onPatch({ financeiro: [...processo.financeiro, lanc] }, `Adicionou lançamento financeiro "${lanc.descricao}"`);
    setDescricao('');
    setValor(0);
    setVencimento('');
  }

  function updateStatus(id: string, status: LancamentoFinanceiro['status']) {
    onPatch(
      { financeiro: processo.financeiro.map((f) => (f.id === id ? { ...f, status } : f)) },
      'Atualizou status financeiro',
    );
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Descrição</label>
            <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Valor (R$)</label>
            <input className="input" type="number" value={valor} onChange={(e) => setValor(Number(e.target.value))} />
          </div>
        </div>
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Vencimento</label>
            <input className="input" type="date" value={vencimento} onChange={(e) => setVencimento(e.target.value)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={add}>
              <Plus size={15} /> Adicionar lançamento
            </button>
          </div>
        </div>
      </div>
      {processo.financeiro.length === 0 ? (
        <p className="text-muted text-sm">Nenhum lançamento financeiro. O módulo completo chega na Fase 3.</p>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {processo.financeiro.map((f) => (
                <tr key={f.id} style={{ cursor: 'default' }}>
                  <td>{f.descricao}</td>
                  <td>{currencyBRL(f.valor)}</td>
                  <td>{formatDateBR(f.vencimento)}</td>
                  <td>
                    <select className="select" value={f.status} onChange={(e) => updateStatus(f.id, e.target.value as LancamentoFinanceiro['status'])}>
                      <option value="pendente">Pendente</option>
                      <option value="aprovado">Aprovado</option>
                      <option value="pago">Pago</option>
                      <option value="atrasado">Atrasado</option>
                    </select>
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
