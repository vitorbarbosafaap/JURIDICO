import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { COMPARATIVO_LEI } from './comparativoLei';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { useConfig } from '../../hooks/useConfig';
import { newId } from '../../data/repository';
import { Tabs } from '../../components/ui/Tabs';
import type { StatusProConsumidor } from '../../data/types';

const TABS = ['Comparativo Lei 15.040/2024', 'Checklist PROCON/Senacon'];

const STATUS_LABEL: Record<StatusProConsumidor, string> = {
  aderido: 'Aderido',
  nao_aderido: 'Não aderido',
  nao_aplicavel: 'Não aplicável',
};

export function Compliance() {
  const [tab, setTab] = useState(TABS[0]);

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Compliance</h2>
          <p className="desc">Referência regulatória e conformidade PROCON/Senacon.</p>
        </div>
      </div>
      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === TABS[0] && <ComparativoTab />}
      {tab === TABS[1] && <ChecklistTab />}
    </div>
  );
}

function ComparativoTab() {
  return (
    <div>
      <p className="text-muted text-sm" style={{ marginBottom: 14 }}>
        Consulta rápida — não substitui a leitura do texto legal integral. Regime anterior: Código Civil
        (arts. 757–802) e Decreto-Lei nº 73/66. Lei nova: Lei nº 15.040/2024, vigente para contratos
        celebrados a partir de 11/12/2025.
      </p>
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th style={{ width: '22%' }}>Tema</th>
              <th style={{ width: '39%' }}>Regime anterior (CC / DL 73/66)</th>
              <th style={{ width: '39%' }}>Lei nº 15.040/2024</th>
            </tr>
          </thead>
          <tbody>
            {COMPARATIVO_LEI.map((row) => (
              <tr key={row.tema} style={{ cursor: 'default' }}>
                <td style={{ fontWeight: 600 }}>{row.tema}</td>
                <td className="text-sm">{row.regimeAnterior}</td>
                <td className="text-sm">{row.leiNova}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ChecklistTab() {
  const { config, update } = useConfig();
  const { items: processos, reload } = useCollection(repos.processos);
  const [novoItem, setNovoItem] = useState('');

  const proconProcessos = processos.filter((p) => p.tipoDemanda === 'PROCON');

  async function addItem() {
    if (!novoItem.trim() || !config) return;
    await update({
      checklistProconGlobal: [
        ...(config.checklistProconGlobal ?? []),
        { id: newId(), item: novoItem.trim(), atendido: false },
      ],
    });
    setNovoItem('');
  }

  async function toggleItem(id: string) {
    if (!config) return;
    await update({
      checklistProconGlobal: (config.checklistProconGlobal ?? []).map((i) =>
        i.id === id ? { ...i, atendido: !i.atendido } : i,
      ),
    });
  }

  async function removeItem(id: string) {
    if (!config) return;
    await update({ checklistProconGlobal: (config.checklistProconGlobal ?? []).filter((i) => i.id !== id) });
  }

  async function updateAdesao(processoId: string, status: StatusProConsumidor) {
    await repos.processos.update(processoId, { adesaoProConsumidor: status });
    reload();
  }

  if (!config) return null;

  return (
    <div className="stack">
      <div className="card card-pad">
        <div className="card-title" style={{ marginBottom: 12 }}>
          Checklist institucional
        </div>
        <div className="stack">
          {(config.checklistProconGlobal ?? []).length === 0 && (
            <p className="text-muted text-sm">Nenhum item cadastrado ainda.</p>
          )}
          {(config.checklistProconGlobal ?? []).map((item) => (
            <label key={item.id} className="row" style={{ justifyContent: 'space-between' }}>
              <span className="row">
                <input type="checkbox" checked={item.atendido} onChange={() => toggleItem(item.id)} />
                <span style={{ textDecoration: item.atendido ? 'line-through' : undefined }}>{item.item}</span>
              </span>
              <button className="icon-btn" onClick={() => removeItem(item.id)}>
                <Trash2 size={14} />
              </button>
            </label>
          ))}
        </div>
        <div className="row" style={{ marginTop: 12 }}>
          <input
            className="input"
            placeholder="Ex.: Cadastro atualizado no ProConsumidor (SINDEC)"
            value={novoItem}
            onChange={(e) => setNovoItem(e.target.value)}
          />
          <button className="btn btn-ghost btn-sm" onClick={addItem}>
            <Plus size={14} /> Adicionar
          </button>
        </div>
      </div>

      <div className="card card-pad">
        <div className="card-title" style={{ marginBottom: 12 }}>
          Status de adesão ao ProConsumidor por processo PROCON
        </div>
        {proconProcessos.length === 0 ? (
          <p className="text-muted text-sm">Nenhum processo do tipo PROCON cadastrado.</p>
        ) : (
          <div className="table-wrap" style={{ border: 'none' }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Processo</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {proconProcessos.map((p) => (
                  <tr key={p.id} style={{ cursor: 'default' }}>
                    <td>{p.numeroCNJ || p.tribunalVara || 'PROCON'}</td>
                    <td>
                      <select
                        className="select"
                        value={p.adesaoProConsumidor ?? 'nao_aderido'}
                        onChange={(e) => updateAdesao(p.id, e.target.value as StatusProConsumidor)}
                      >
                        {(Object.keys(STATUS_LABEL) as StatusProConsumidor[]).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
