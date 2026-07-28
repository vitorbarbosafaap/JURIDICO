import { useState } from 'react';
import { Trash2, Plus } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { useConfig } from '../../hooks/useConfig';
import { newId } from '../../data/repository';
import { Tabs } from '../../components/ui/Tabs';
import { IntegracaoDadosTab } from './IntegracaoDadosTab';
import { SegurancaTab } from './SegurancaTab';
import type { Escritorio, Seguradora } from '../../data/types';

const TABS = [
  'Escritórios',
  'Seguradoras',
  'Tipos de Peça (prazos padrão)',
  'Feriados Forenses',
  'Integração de Dados',
  'Segurança',
];

export function Configuracoes() {
  const [tab, setTab] = useState(TABS[0]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Configurações</h2>
          <p className="desc">Cadastros de apoio usados por Prazos, Processos e Financeiro.</p>
        </div>
      </div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'Escritórios' && <EscritoriosTab />}
      {tab === 'Seguradoras' && <SeguradorasTab />}
      {tab === 'Tipos de Peça (prazos padrão)' && <TiposPecaTab />}
      {tab === 'Feriados Forenses' && <FeriadosTab />}
      {tab === 'Integração de Dados' && <IntegracaoDadosTab />}
      {tab === 'Segurança' && <SegurancaTab />}
    </div>
  );
}

function EscritoriosTab() {
  const { items, reload } = useCollection(repos.escritorios);
  const [nome, setNome] = useState('');
  const [tipo, setTipo] = useState<'interno' | 'externo'>('externo');

  async function add() {
    if (!nome.trim()) return;
    await repos.escritorios.create({ id: newId(), nome: nome.trim(), tipo, contatos: [] } as Escritorio);
    setNome('');
    reload();
  }

  async function addContato(esc: Escritorio, contatoNome: string) {
    if (!contatoNome.trim()) return;
    await repos.escritorios.update(esc.id, {
      contatos: [...esc.contatos, { id: newId(), nome: contatoNome.trim() }],
    });
    reload();
  }

  async function removeContato(esc: Escritorio, contatoId: string) {
    await repos.escritorios.update(esc.id, {
      contatos: esc.contatos.filter((c) => c.id !== contatoId),
    });
    reload();
  }

  async function remove(id: string) {
    await repos.escritorios.softDelete(id);
    reload();
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="form-row" style={{ alignItems: 'flex-end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Nome do escritório</label>
            <input className="input" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Viseu Advogados" />
          </div>
          <div className="row">
            <select className="select" value={tipo} onChange={(e) => setTipo(e.target.value as 'interno' | 'externo')}>
              <option value="externo">Externo</option>
              <option value="interno">Interno</option>
            </select>
            <button className="btn btn-primary" onClick={add}>
              <Plus size={15} /> Adicionar
            </button>
          </div>
        </div>
      </div>

      {items.map((esc) => (
        <div className="card card-pad" key={esc.id}>
          <div className="row" style={{ justifyContent: 'space-between' }}>
            <div>
              <strong>{esc.nome}</strong> <span className="badge badge-neutral">{esc.tipo}</span>
            </div>
            <button className="icon-btn" onClick={() => remove(esc.id)}>
              <Trash2 size={15} />
            </button>
          </div>
          <div className="pill-list" style={{ marginTop: 10 }}>
            {esc.contatos.map((c) => (
              <span className="badge badge-neutral" key={c.id}>
                {c.nome}
                <button
                  className="icon-btn"
                  style={{ padding: 0, marginLeft: 4 }}
                  onClick={() => removeContato(esc, c.id)}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <ContatoForm onAdd={(n) => addContato(esc, n)} />
        </div>
      ))}
    </div>
  );
}

function ContatoForm({ onAdd }: { onAdd: (nome: string) => void }) {
  const [nome, setNome] = useState('');
  return (
    <div className="row" style={{ marginTop: 8 }}>
      <input
        className="input"
        placeholder="Novo contato"
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        style={{ maxWidth: 220 }}
      />
      <button
        className="btn btn-ghost btn-sm"
        onClick={() => {
          onAdd(nome);
          setNome('');
        }}
      >
        + Contato
      </button>
    </div>
  );
}

function SeguradorasTab() {
  const { items, reload } = useCollection(repos.seguradoras);
  const [form, setForm] = useState({ nome: '', cnpj: '', susep: '' });

  async function add() {
    if (!form.nome.trim()) return;
    await repos.seguradoras.create({ id: newId(), ...form } as Seguradora);
    setForm({ nome: '', cnpj: '', susep: '' });
    reload();
  }

  async function update(id: string, patch: Partial<Seguradora>) {
    await repos.seguradoras.update(id, patch);
    reload();
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Nome</label>
            <input className="input" value={form.nome} onChange={(e) => setForm({ ...form, nome: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>CNPJ</label>
            <input className="input" value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
          </div>
        </div>
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>SUSEP</label>
            <input className="input" value={form.susep} onChange={(e) => setForm({ ...form, susep: e.target.value })} />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn btn-primary" onClick={add}>
              <Plus size={15} /> Adicionar seguradora
            </button>
          </div>
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>CNPJ</th>
              <th>SUSEP</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.map((s) => (
              <tr key={s.id} style={{ cursor: 'default' }}>
                <td>{s.nome}</td>
                <td>
                  <input
                    className="input"
                    defaultValue={s.cnpj}
                    onBlur={(e) => update(s.id, { cnpj: e.target.value })}
                  />
                </td>
                <td>
                  <input
                    className="input"
                    defaultValue={s.susep}
                    onBlur={(e) => update(s.id, { susep: e.target.value })}
                  />
                </td>
                <td>
                  <button className="icon-btn" onClick={() => repos.seguradoras.softDelete(s.id).then(reload)}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TiposPecaTab() {
  const { config, update } = useConfig();
  const [tipo, setTipo] = useState('');
  const [dias, setDias] = useState(10);

  if (!config) return null;

  async function add() {
    if (!tipo.trim()) return;
    await update({ tiposPeca: [...config!.tiposPeca, { id: newId(), tipo: tipo.trim(), diasUteis: dias }] });
    setTipo('');
    setDias(10);
  }

  async function remove(id: string) {
    await update({ tiposPeca: config!.tiposPeca.filter((t) => t.id !== id) });
  }

  async function editDias(id: string, novo: number) {
    await update({
      tiposPeca: config!.tiposPeca.map((t) => (t.id === id ? { ...t, diasUteis: novo } : t)),
    });
  }

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Tipo de peça</label>
            <input className="input" value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="Ex.: Contestação" />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Prazo (dias úteis)</label>
            <input
              className="input"
              type="number"
              min={0}
              value={dias}
              onChange={(e) => setDias(Number(e.target.value))}
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={add}>
          <Plus size={15} /> Adicionar tipo de peça
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Tipo de peça</th>
              <th>Dias úteis</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {config.tiposPeca.map((t) => (
              <tr key={t.id} style={{ cursor: 'default' }}>
                <td>{t.tipo}</td>
                <td style={{ maxWidth: 120 }}>
                  <input
                    className="input"
                    type="number"
                    defaultValue={t.diasUteis}
                    onBlur={(e) => editDias(t.id, Number(e.target.value))}
                  />
                </td>
                <td>
                  <button className="icon-btn" onClick={() => remove(t.id)}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function FeriadosTab() {
  const { config, update } = useConfig();
  const [data, setData] = useState('');
  const [descricao, setDescricao] = useState('');

  if (!config) return null;

  async function add() {
    if (!data || !descricao.trim()) return;
    await update({
      feriadosCustom: [...config!.feriadosCustom, { id: newId(), data, descricao: descricao.trim() }],
    });
    setData('');
    setDescricao('');
  }

  async function remove(id: string) {
    await update({ feriadosCustom: config!.feriadosCustom.filter((f) => f.id !== id) });
  }

  return (
    <div className="stack">
      <p className="text-muted text-sm">
        Feriados nacionais (fixos e móveis) já são calculados automaticamente. Use esta lista apenas para
        recessos forenses e feriados locais/estaduais adicionais.
      </p>
      <div className="card card-pad">
        <div className="form-row">
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Data</label>
            <input className="input" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Descrição</label>
            <input
              className="input"
              value={descricao}
              onChange={(e) => setDescricao(e.target.value)}
              placeholder="Ex.: Recesso forense"
            />
          </div>
        </div>
        <button className="btn btn-primary" onClick={add}>
          <Plus size={15} /> Adicionar feriado
        </button>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Data</th>
              <th>Descrição</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {config.feriadosCustom.map((f) => (
              <tr key={f.id} style={{ cursor: 'default' }}>
                <td>{new Date(f.data + 'T00:00:00').toLocaleDateString('pt-BR')}</td>
                <td>{f.descricao}</td>
                <td>
                  <button className="icon-btn" onClick={() => remove(f.id)}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
