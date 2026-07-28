import { useMemo, useState } from 'react';
import { Printer, FileDown, Copy } from 'lucide-react';
import {
  MOTIVOS,
  COMMON_FIELDS,
  PROCON_FIELDS,
  JUDICIAL_FIELDS,
  buildSubsidioHTML,
  type Motivo,
  type MotivoField,
  type MotivoVars,
} from '../../data/subsidiosCatalogo';
import { hydrateExhibitSlots } from '../../lib/docBlocks';
import { htmlToDocBlocks } from '../../lib/htmlToDocBlocks';
import { exportDocBlocksToDocx } from '../../lib/docxExport';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import { useCollection } from '../../hooks/useCollection';
import { EmptyState } from '../../components/ui/EmptyState';

type Tipo = 'procon' | 'judicial';

function Field({ f, value, onChange }: { f: MotivoField; value: string; onChange: (v: string) => void }) {
  if (f.type === 'select') {
    return (
      <div className="field">
        <label>{f.label}</label>
        <select className="select" value={value} onChange={(e) => onChange(e.target.value)}>
          <option value="">—</option>
          {(f.options ?? []).map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </div>
    );
  }
  if (f.type === 'textarea') {
    return (
      <div className="field">
        <label>{f.label}</label>
        <textarea className="textarea" placeholder={f.ph} value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    );
  }
  return (
    <div className="field">
      <label>{f.label}</label>
      <input
        className="input"
        type={f.type === 'date' ? 'date' : f.type === 'number' ? 'number' : 'text'}
        placeholder={f.ph}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

export function GeradorSubsidios() {
  const { items: processos } = useCollection(repos.processos);
  const { items: clientes } = useCollection(repos.clientes);

  const [tipo, setTipo] = useState<Tipo>('procon');
  const [motivoId, setMotivoId] = useState<string | null>(null);
  const [ramoId, setRamoId] = useState<string | null>(null);
  const [vars, setVars] = useState<MotivoVars>({ assinante: 'Jurídico Pitzi' });
  const [search, setSearch] = useState('');
  const [processoId, setProcessoId] = useState('');
  const [alegacaoTouched, setAlegacaoTouched] = useState(false);

  const motivo = MOTIVOS.find((m) => m.id === motivoId) ?? null;
  const ramo = motivo ? motivo.ramos.find((r) => r.id === ramoId) ?? motivo.ramos[0] : null;

  const grupos = useMemo(() => {
    const q = search.trim().toLowerCase();
    const map = new Map<string, Motivo[]>();
    MOTIVOS.forEach((m) => {
      if (q && !m.titulo.toLowerCase().includes(q) && !m.quandoUsar.toLowerCase().includes(q)) return;
      map.set(m.grupo, [...(map.get(m.grupo) ?? []), m]);
    });
    return Array.from(map.entries());
  }, [search]);

  function selectMotivo(m: Motivo) {
    setMotivoId(m.id);
    setRamoId(m.ramos[0].id);
    if (!alegacaoTouched) setVars((v) => ({ ...v, alegacao: m.alegacaoDefault }));
    const patch: MotivoVars = {};
    m.camposExtras.forEach((f) => {
      if (vars[f.key] === undefined && f.default !== undefined) patch[f.key] = f.default;
    });
    if (Object.keys(patch).length) setVars((v) => ({ ...v, ...patch }));
  }

  function setVar(key: string, value: string) {
    if (key === 'alegacao') setAlegacaoTouched(true);
    setVars((v) => ({ ...v, [key]: value }));
  }

  function applyProcesso(id: string) {
    setProcessoId(id);
    const proc = processos.find((p) => p.id === id);
    const cliente = proc ? clientes.find((c) => c.id === proc.clienteId) : undefined;
    if (cliente) {
      setVars((v) => ({
        ...v,
        nome: cliente.nome,
        cpf: cliente.cpf ?? v.cpf ?? '',
        source: proc?.canalVenda ?? v.source ?? '',
      }));
    }
    if (proc?.numeroCNJ) setVars((v) => ({ ...v, numeroProcesso: proc.numeroCNJ ?? '' }));
  }

  const docHtmlRaw = motivo && ramo ? buildSubsidioHTML(tipo, motivo, ramo, vars) : '';
  const docHtml = ramo ? hydrateExhibitSlots(docHtmlRaw, ramo.docs) : '';

  async function handleExportDocx() {
    if (!motivo) return;
    const blocks = htmlToDocBlocks(docHtml);
    await exportDocBlocksToDocx(blocks, `Subsidio-${tipo}-${motivo.id}`);
    if (processoId) {
      const proc = processos.find((p) => p.id === processoId);
      if (proc) {
        await repos.processos.update(proc.id, {
          comunicacoes: [
            ...proc.comunicacoes,
            {
              id: newId(),
              at: new Date().toISOString(),
              canal: 'sistema',
              resumo: `Subsídio gerado (${motivo.titulo} — ${ramo?.label}).`,
            },
          ],
        });
      }
    }
    await repos.subsidiosGerados.create({
      id: newId(),
      processoId: processoId || undefined,
      tipo,
      motivoId: motivo.id,
      ramoId: ramo?.id ?? '',
      vars,
      createdAt: new Date().toISOString(),
    });
  }

  function handleCopy() {
    const el = document.getElementById('subsidio-doc-preview');
    if (!el) return;
    const range = document.createRange();
    range.selectNodeContents(el);
    const sel = window.getSelection();
    sel?.removeAllRanges();
    sel?.addRange(range);
    try {
      document.execCommand('copy');
    } catch {
      /* clipboard permissions vary by browser; selection remains for manual copy */
    }
    sel?.removeAllRanges();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Gerador de Subsídios</h2>
          <p className="desc">Catálogo de {MOTIVOS.length} motivos validados, com defesa PROCON ou subsídio judicial.</p>
        </div>
        <div className="row">
          <div className="calendar-view-toggle">
            <button className={tipo === 'procon' ? 'active' : ''} onClick={() => setTipo('procon')}>
              PROCON
            </button>
            <button className={tipo === 'judicial' ? 'active' : ''} onClick={() => setTipo('judicial')}>
              Subsídio Judicial
            </button>
          </div>
        </div>
      </div>

      <div className="doc-tool">
        <div className="doc-tool-rail">
          <div className="doc-rail-search">
            <input
              className="input"
              placeholder="Buscar motivo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          {grupos.map(([grupo, items]) => (
            <div key={grupo}>
              <div className="doc-rail-group-title">{grupo}</div>
              {items.map((m) => (
                <div
                  key={m.id}
                  className={`doc-rail-item ${m.id === motivoId ? 'active' : ''}`}
                  onClick={() => selectMotivo(m)}
                >
                  <span className="num">{m.numero}</span>
                  <span>{m.titulo}</span>
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="doc-tool-form">
          {!motivo ? (
            <div style={{ padding: 24 }}>
              <EmptyState
                icon="§"
                title="Monte o subsídio do caso"
                description="Escolha um motivo no índice ao lado. O formulário se adapta aos campos, fundamentos e documentos daquele tipo de caso."
              />
            </div>
          ) : (
            <>
              <div className="doc-tool-form-header">
                <div className="text-muted text-sm">
                  Motivo {motivo.numero} · {motivo.grupo}
                </div>
                <div style={{ fontWeight: 700, fontSize: 15, margin: '4px 0 6px' }}>{motivo.titulo}</div>
                <div className="text-muted text-sm">{motivo.quandoUsar}</div>
              </div>
              <div className="doc-tool-form-body">
                <div className="field">
                  <label>Vincular a processo (opcional)</label>
                  <select className="select" value={processoId} onChange={(e) => applyProcesso(e.target.value)}>
                    <option value="">Sem vínculo</option>
                    {processos.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.numeroCNJ || p.tribunalVara || p.tipoDemanda}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="doc-fieldset">
                  <h5>Dados do caso</h5>
                  {COMMON_FIELDS.map((f) => (
                    <Field key={f.key} f={f} value={vars[f.key] ?? ''} onChange={(val) => setVar(f.key, val)} />
                  ))}
                </div>

                <div className="doc-fieldset">
                  <h5>{tipo === 'procon' ? 'Peça — PROCON' : 'Peça — subsídio judicial'}</h5>
                  {(tipo === 'procon' ? PROCON_FIELDS : JUDICIAL_FIELDS).map((f) => (
                    <Field key={f.key} f={f} value={vars[f.key] ?? f.default ?? ''} onChange={(val) => setVar(f.key, val)} />
                  ))}
                </div>

                <div className="doc-fieldset">
                  <h5>Alegação ({tipo === 'procon' ? 'inicial / PROCON' : 'da parte autora'})</h5>
                  <div className="field">
                    <textarea
                      className="textarea"
                      style={{ minHeight: 74 }}
                      value={vars.alegacao ?? motivo.alegacaoDefault}
                      onChange={(e) => setVar('alegacao', e.target.value)}
                    />
                  </div>
                </div>

                {tipo === 'judicial' && (
                  <div className="doc-fieldset">
                    <h5>Requisições da parte autora</h5>
                    <Field f={{ key: 'pedidoObrigacaoFazer', label: 'Obrigação de fazer', type: 'text', ph: 'opcional' }} value={vars.pedidoObrigacaoFazer ?? ''} onChange={(v) => setVar('pedidoObrigacaoFazer', v)} />
                    <div className="form-row">
                      <Field f={{ key: 'danosMateriais', label: 'Danos materiais (R$)', type: 'text', ph: '0,00' }} value={vars.danosMateriais ?? ''} onChange={(v) => setVar('danosMateriais', v)} />
                      <Field f={{ key: 'danosMorais', label: 'Danos morais (R$)', type: 'text', ph: '0,00' }} value={vars.danosMorais ?? ''} onChange={(v) => setVar('danosMorais', v)} />
                    </div>
                  </div>
                )}

                {motivo.camposExtras.length > 0 && (
                  <div className="doc-fieldset">
                    <h5>Detalhes específicos do motivo</h5>
                    {motivo.camposExtras.map((f) => (
                      <Field key={f.key} f={f} value={vars[f.key] ?? f.default ?? ''} onChange={(val) => setVar(f.key, val)} />
                    ))}
                  </div>
                )}

                <div className="doc-fieldset">
                  <h5>Fundamento aplicável</h5>
                  <div className="ramo-list">
                    {motivo.ramos.map((r) => (
                      <div
                        key={r.id}
                        className={`ramo-opt ${r.id === ramoId ? 'sel' : ''}`}
                        onClick={() => setRamoId(r.id)}
                      >
                        <div className="r-top">
                          <input type="radio" checked={r.id === ramoId} readOnly />
                          {r.label}
                        </div>
                        {r.docs.length > 0 && (
                          <div className="r-docs">
                            {r.docs.length} doc(s): {r.docs.map((d) => d.label).join(' · ')}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div className="doc-ref-note">Modelo baseado em casos reais: {motivo.baseCasos}</div>
              </div>
            </>
          )}
        </div>

        <div className="doc-tool-doc">
          <div className="doc-toolbar">
            <button className="btn btn-ghost btn-sm" onClick={handleCopy} disabled={!motivo}>
              <Copy size={13} /> Copiar
            </button>
            <div className="spacer" />
            <button className="btn btn-ghost btn-sm" onClick={() => window.print()} disabled={!motivo}>
              <Printer size={13} /> Imprimir / PDF
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleExportDocx} disabled={!motivo}>
              <FileDown size={13} /> Exportar .docx
            </button>
          </div>
          {!motivo ? (
            <EmptyState icon="§" title="Nenhum caso selecionado" description="Escolha um motivo para ver o subsídio sendo montado aqui, já no layout padrão de envio." />
          ) : (
            <div className="doc-preview" id="subsidio-doc-preview" dangerouslySetInnerHTML={{ __html: docHtml }} />
          )}
        </div>
      </div>
    </div>
  );
}
