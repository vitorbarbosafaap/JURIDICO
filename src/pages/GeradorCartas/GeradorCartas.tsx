import { useMemo, useState } from 'react';
import { FileDown, Printer, ChevronRight, ChevronLeft, Plus } from 'lucide-react';
import { CATEGORIAS_RECUSA, findHipotese, type CartaVars } from '../../data/cartasRecusaCatalogo';
import { buildCartaHTML } from './cartaBuilder';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import { useCollection } from '../../hooks/useCollection';
import { htmlToDocBlocks } from '../../lib/htmlToDocBlocks';
import { exportDocBlocksToDocx } from '../../lib/docxExport';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import type { CartaRecusa, Genero, StatusAprovacao } from '../../data/types';

const STATUS_ORDER: StatusAprovacao[] = ['rascunho', 'revisao', 'aprovado', 'enviado'];
const STATUS_LABEL: Record<StatusAprovacao, string> = {
  rascunho: 'Rascunho',
  revisao: 'Em revisão',
  aprovado: 'Aprovado',
  enviado: 'Enviado',
};

const TABS = ['Nova Carta', 'Cartas Salvas'];

export function GeradorCartas() {
  const [tab, setTab] = useState(TABS[0]);
  const { items: seguradoras } = useCollection(repos.seguradoras);
  const { items: processos } = useCollection(repos.processos);
  const { items: cartas, reload } = useCollection(repos.cartasRecusa);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [seguradoraId, setSeguradoraId] = useState('');
  const [genero, setGenero] = useState<Genero>('masculino');
  const [categoriaId, setCategoriaId] = useState(CATEGORIAS_RECUSA[0].id);
  const [hipoteseId, setHipoteseId] = useState(CATEGORIAS_RECUSA[0].hipoteses[0].id);
  const [processoId, setProcessoId] = useState('');
  const [vars, setVars] = useState<CartaVars>({ notificarResolucao: 'nao' });

  const categoria = CATEGORIAS_RECUSA.find((c) => c.id === categoriaId)!;
  const hipotese = findHipotese(categoriaId, hipoteseId);
  const seguradora = seguradoras.find((s) => s.id === seguradoraId);

  const html = useMemo(
    () => buildCartaHTML(categoriaId, hipoteseId, vars, genero, seguradora),
    [categoriaId, hipoteseId, vars, genero, seguradora],
  );

  function setVar(key: string, value: string) {
    setVars((v) => ({ ...v, [key]: value }));
  }

  function selectHipotese(catId: string, hipId: string) {
    setCategoriaId(catId);
    setHipoteseId(hipId);
  }

  function novaCartaEmBranco() {
    setEditingId(null);
    setSeguradoraId('');
    setGenero('masculino');
    setCategoriaId(CATEGORIAS_RECUSA[0].id);
    setHipoteseId(CATEGORIAS_RECUSA[0].hipoteses[0].id);
    setProcessoId('');
    setVars({ notificarResolucao: 'nao' });
    setTab(TABS[0]);
  }

  function abrirCarta(c: CartaRecusa) {
    setEditingId(c.id);
    setSeguradoraId(c.seguradoraId ?? '');
    setGenero(c.genero);
    setCategoriaId(c.categoriaHipoteseId.split('::')[0]);
    setHipoteseId(c.categoriaHipoteseId.split('::')[1]);
    setProcessoId(c.processoId ?? '');
    setVars(c.vars);
    setTab(TABS[0]);
  }

  async function salvarRascunho() {
    const now = new Date().toISOString();
    if (editingId) {
      await repos.cartasRecusa.update(editingId, {
        seguradoraId: seguradoraId || undefined,
        genero,
        categoriaHipoteseId: `${categoriaId}::${hipoteseId}`,
        processoId: processoId || undefined,
        vars,
        updatedAt: now,
      });
    } else {
      const carta: CartaRecusa = {
        id: newId(),
        seguradoraId: seguradoraId || undefined,
        genero,
        categoriaHipoteseId: `${categoriaId}::${hipoteseId}`,
        processoId: processoId || undefined,
        vars,
        status: 'rascunho',
        createdAt: now,
        updatedAt: now,
        historico: [{ id: newId(), at: now, de: null, para: 'rascunho', autor: 'Você' }],
      };
      await repos.cartasRecusa.create(carta);
      setEditingId(carta.id);
    }
    reload();
  }

  async function mudarStatus(c: CartaRecusa, direcao: 1 | -1) {
    const idx = STATUS_ORDER.indexOf(c.status);
    const novoIdx = Math.min(STATUS_ORDER.length - 1, Math.max(0, idx + direcao));
    const novoStatus = STATUS_ORDER[novoIdx];
    if (novoStatus === c.status) return;
    await repos.cartasRecusa.update(c.id, {
      status: novoStatus,
      updatedAt: new Date().toISOString(),
      historico: [...c.historico, { id: newId(), at: new Date().toISOString(), de: c.status, para: novoStatus, autor: 'Você' }],
    });
    reload();
  }

  async function handleExportDocx() {
    const blocks = htmlToDocBlocks(html);
    await exportDocBlocksToDocx(blocks, `Carta-Recusa-${categoriaId}-${hipoteseId}`);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Cartas de Recusa / Notificação de Sinistro</h2>
          <p className="desc">Lei nº 15.040/2024 — fluxo de aprovação: rascunho → revisão → aprovado → enviado.</p>
        </div>
        <button className="btn btn-ghost" onClick={novaCartaEmBranco}>
          <Plus size={15} /> Nova carta
        </button>
      </div>

      <Tabs tabs={TABS} active={tab} onChange={setTab} />

      {tab === 'Nova Carta' && (
        <div className="doc-tool">
          <div className="doc-tool-rail">
            <div className="doc-rail-search">
              <select className="select" value={seguradoraId} onChange={(e) => setSeguradoraId(e.target.value)}>
                <option value="">Selecionar seguradora</option>
                {seguradoras.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
              </select>
            </div>
            {CATEGORIAS_RECUSA.map((cat) => (
              <div key={cat.id}>
                <div className="doc-rail-group-title">{cat.titulo}</div>
                {cat.hipoteses.map((h) => (
                  <div
                    key={h.id}
                    className={`doc-rail-item ${h.id === hipoteseId && cat.id === categoriaId ? 'active' : ''}`}
                    onClick={() => selectHipotese(cat.id, h.id)}
                  >
                    {h.label}
                  </div>
                ))}
              </div>
            ))}
          </div>

          <div className="doc-tool-form">
            <div className="doc-tool-form-header">
              <div className="text-muted text-sm">{categoria.titulo}</div>
              <div style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 6px' }}>{hipotese?.label}</div>
              <div className="text-muted text-sm">{hipotese?.quandoUsar}</div>
            </div>
            <div className="doc-tool-form-body">
              <div className="field">
                <label>Gênero (concordância do texto)</label>
                <select className="select" value={genero} onChange={(e) => setGenero(e.target.value as Genero)}>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                </select>
              </div>
              <div className="field">
                <label>Vincular a processo (opcional)</label>
                <select className="select" value={processoId} onChange={(e) => setProcessoId(e.target.value)}>
                  <option value="">Sem vínculo</option>
                  {processos.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.numeroCNJ || p.tribunalVara || p.tipoDemanda}
                    </option>
                  ))}
                </select>
              </div>

              <div className="doc-fieldset">
                <h5>Dados do segurado e da apólice</h5>
                <div className="field">
                  <label>Nome do segurado</label>
                  <input className="input" value={vars.nome ?? ''} onChange={(e) => setVar('nome', e.target.value)} />
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>CPF</label>
                    <input className="input" value={vars.cpf ?? ''} onChange={(e) => setVar('cpf', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Apólice/Bilhete nº</label>
                    <input className="input" value={vars.apolice ?? ''} onChange={(e) => setVar('apolice', e.target.value)} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="field">
                    <label>Sinistro nº</label>
                    <input className="input" value={vars.sinistro ?? ''} onChange={(e) => setVar('sinistro', e.target.value)} />
                  </div>
                  <div className="field">
                    <label>Data do sinistro</label>
                    <input className="input" type="date" value={vars.dataSinistro ?? ''} onChange={(e) => setVar('dataSinistro', e.target.value)} />
                  </div>
                </div>
                <div className="field">
                  <label>Resumo dos fatos</label>
                  <textarea className="textarea" value={vars.resumoFatos ?? ''} onChange={(e) => setVar('resumoFatos', e.target.value)} />
                </div>
              </div>

              {hipotese && hipotese.camposExtras.length > 0 && (
                <div className="doc-fieldset">
                  <h5>Detalhes da hipótese</h5>
                  {hipotese.camposExtras.map((f) => (
                    <div className="field" key={f.key}>
                      <label>{f.label}</label>
                      {f.type === 'textarea' ? (
                        <textarea className="textarea" placeholder={f.ph} value={vars[f.key] ?? ''} onChange={(e) => setVar(f.key, e.target.value)} />
                      ) : (
                        <input
                          className="input"
                          type={f.type === 'date' ? 'date' : 'text'}
                          placeholder={f.ph}
                          value={vars[f.key] ?? ''}
                          onChange={(e) => setVar(f.key, e.target.value)}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="doc-fieldset">
                <h5>Notificação de resolução do contrato</h5>
                <label className="row" style={{ fontSize: 13, fontWeight: 600 }}>
                  <input
                    type="checkbox"
                    checked={vars.notificarResolucao === 'sim'}
                    onChange={(e) => setVar('notificarResolucao', e.target.checked ? 'sim' : 'nao')}
                  />
                  Incluir notificação de resolução do contrato de proteção
                </label>
              </div>

              <div className="doc-ref-note">Fundamento legal: {hipotese?.fundamentoLegal}</div>

              <button className="btn btn-primary" style={{ marginTop: 16, width: '100%' }} onClick={salvarRascunho}>
                {editingId ? 'Salvar alterações' : 'Salvar como rascunho'}
              </button>
            </div>
          </div>

          <div className="doc-tool-doc">
            <div className="doc-toolbar">
              <div className="spacer" />
              <button className="btn btn-ghost btn-sm" onClick={() => window.print()}>
                <Printer size={13} /> Imprimir / PDF
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleExportDocx}>
                <FileDown size={13} /> Exportar .docx
              </button>
            </div>
            <div className="doc-preview" dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        </div>
      )}

      {tab === 'Cartas Salvas' &&
        (cartas.length === 0 ? (
          <EmptyState icon="✉️" title="Nenhuma carta salva" description="Monte uma carta na aba 'Nova Carta' e clique em salvar como rascunho." />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Segurado</th>
                  <th>Seguradora</th>
                  <th>Hipótese</th>
                  <th>Status</th>
                  <th>Atualizado em</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cartas.map((c) => {
                  const [catId, hipId] = c.categoriaHipoteseId.split('::');
                  const h = findHipotese(catId, hipId);
                  const seg = seguradoras.find((s) => s.id === c.seguradoraId);
                  return (
                    <tr key={c.id} onClick={() => abrirCarta(c)}>
                      <td>{c.vars.nome || '—'}</td>
                      <td>{seg?.nome ?? '—'}</td>
                      <td>{h?.label ?? '—'}</td>
                      <td>
                        <Badge variant={c.status === 'enviado' ? 'ok' : c.status === 'aprovado' ? 'accent' : 'neutral'}>
                          {STATUS_LABEL[c.status]}
                        </Badge>
                      </td>
                      <td>{new Date(c.updatedAt).toLocaleString('pt-BR')}</td>
                      <td>
                        <div className="row" onClick={(e) => e.stopPropagation()}>
                          <button
                            className="icon-btn"
                            disabled={c.status === 'rascunho'}
                            onClick={() => mudarStatus(c, -1)}
                            aria-label="Voltar etapa"
                          >
                            <ChevronLeft size={15} />
                          </button>
                          <button
                            className="icon-btn"
                            disabled={c.status === 'enviado'}
                            onClick={() => mudarStatus(c, 1)}
                            aria-label="Avançar etapa"
                          >
                            <ChevronRight size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
    </div>
  );
}
