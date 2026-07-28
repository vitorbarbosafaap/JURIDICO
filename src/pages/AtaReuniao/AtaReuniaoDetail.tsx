import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { repos } from '../../data/db';
import { newId } from '../../data/repository';
import { useCollection } from '../../hooks/useCollection';
import { useConfig } from '../../hooks/useConfig';
import { buildHolidaySet, businessDaysBetween, formatDateBR, todayISO } from '../../lib/businessDays';
import type { AtaAcao, AtaReuniao, Prazo } from '../../data/types';

function parseParticipantes(raw: string): string[] {
  return raw
    .split(/[\n,]+/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function AtaReuniaoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [ata, setAta] = useState<AtaReuniao | null | undefined>(undefined);
  const { items: processos } = useCollection(repos.processos);
  const { config } = useConfig();

  useEffect(() => {
    if (!id) return;
    repos.atas.get(id).then((a) => setAta(a ?? null));
    return repos.atas.subscribe(() => repos.atas.get(id).then((a) => setAta(a ?? null)));
  }, [id]);

  if (ata === undefined) return <p className="text-muted">Carregando…</p>;
  if (ata === null) {
    return (
      <div>
        <p>Ata não encontrada.</p>
        <button className="btn btn-ghost" onClick={() => navigate('/ata')}>
          Voltar
        </button>
      </div>
    );
  }

  async function patch(fields: Partial<AtaReuniao>) {
    if (!ata) return;
    await repos.atas.update(ata.id, fields);
  }

  async function gerarPrazo(acao: AtaAcao) {
    if (!ata || !config || !acao.prazo || acao.prazoId) return;
    const dataBase = todayISO();
    const year = new Date().getFullYear();
    const holidays = buildHolidaySet(config.feriadosCustom, [year, year + 1]);
    const prazoDiasUteis = businessDaysBetween(dataBase, acao.prazo, holidays);
    const prazo: Prazo = {
      id: newId(),
      processoId: ata.processoId,
      tipo: `Ação de ata: ${acao.descricao}`,
      prazoDiasUteis,
      dataBase,
      dataVencimento: acao.prazo,
      responsavel: 'interno',
      status: 'pendente',
      createdAt: new Date().toISOString(),
    };
    await repos.prazos.create(prazo);
    const updatedAcoes = ata.acoes.map((a) => (a.id === acao.id ? { ...a, prazoId: prazo.id } : a));
    await repos.atas.update(ata.id, { acoes: updatedAcoes });
  }

  function updateAcao(acaoId: string, fields: Partial<AtaAcao>) {
    if (!ata) return;
    patch({ acoes: ata.acoes.map((a) => (a.id === acaoId ? { ...a, ...fields } : a)) });
  }

  function addAcao(acao: AtaAcao) {
    if (!ata) return;
    patch({ acoes: [...ata.acoes, acao] });
  }

  const pendentes = ata.acoes.filter((a) => !a.concluida).length;
  const concluidas = ata.acoes.filter((a) => a.concluida).length;

  return (
    <div>
      <button className="btn btn-ghost btn-sm" style={{ marginBottom: 14 }} onClick={() => navigate('/ata')}>
        <ArrowLeft size={14} /> Voltar para Atas
      </button>

      <div className="page-header">
        <div>
          <h2>{ata.titulo}</h2>
          <p className="desc">
            {formatDateBR(ata.data)} · {ata.participantes.length} participante(s) · {pendentes} ação(ões) pendente(s), {concluidas} concluída(s)
          </p>
        </div>
        <button
          className="btn btn-danger"
          onClick={async () => {
            await repos.atas.softDelete(ata.id);
            navigate('/ata');
          }}
        >
          <Trash2 size={15} /> Excluir
        </button>
      </div>

      <div className="card card-pad" style={{ marginBottom: 16 }}>
        <div className="card-title" style={{ marginBottom: 12 }}>
          Visão geral
        </div>
        <div className="form-row">
          <div className="field">
            <label>Título</label>
            <input
              className="input"
              defaultValue={ata.titulo}
              onBlur={(e) => e.target.value !== ata.titulo && patch({ titulo: e.target.value })}
            />
          </div>
          <div className="field">
            <label>Data</label>
            <input
              className="input"
              type="date"
              defaultValue={ata.data}
              onBlur={(e) => e.target.value !== ata.data && patch({ data: e.target.value })}
            />
          </div>
        </div>
        <div className="field">
          <label>Participantes (um por linha ou separados por vírgula)</label>
          <textarea
            className="textarea"
            rows={2}
            defaultValue={ata.participantes.join('\n')}
            onBlur={(e) => patch({ participantes: parseParticipantes(e.target.value) })}
          />
          <div className="pill-list" style={{ marginTop: 8 }}>
            {ata.participantes.map((p) => (
              <span className="badge badge-neutral" key={p}>
                {p}
              </span>
            ))}
          </div>
        </div>
        <div className="field">
          <label>Pauta</label>
          <textarea
            className="textarea"
            rows={3}
            defaultValue={ata.pauta}
            onBlur={(e) => e.target.value !== ata.pauta && patch({ pauta: e.target.value })}
          />
        </div>
        <div className="field">
          <label>Decisões</label>
          <textarea
            className="textarea"
            rows={3}
            defaultValue={ata.decisoes}
            onBlur={(e) => e.target.value !== ata.decisoes && patch({ decisoes: e.target.value })}
          />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Processo vinculado</label>
          <select
            className="select"
            value={ata.processoId ?? ''}
            onChange={(e) => patch({ processoId: e.target.value || undefined })}
          >
            <option value="">Sem vínculo</option>
            {processos.map((p) => (
              <option key={p.id} value={p.id}>
                {p.numeroCNJ || p.tribunalVara || p.tipoDemanda}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="card-title" style={{ marginBottom: 12 }}>
        Ações
      </div>
      <AcoesEditor ata={ata} onUpdate={updateAcao} onGerarPrazo={gerarPrazo} onAdd={addAcao} />
    </div>
  );
}

function AcoesEditor({
  ata,
  onUpdate,
  onGerarPrazo,
  onAdd,
}: {
  ata: AtaReuniao;
  onUpdate: (acaoId: string, fields: Partial<AtaAcao>) => void;
  onGerarPrazo: (acao: AtaAcao) => void;
  onAdd: (acao: AtaAcao) => void;
}) {
  const [descricao, setDescricao] = useState('');
  const [responsavel, setResponsavel] = useState('');
  const [prazo, setPrazo] = useState('');

  function add() {
    if (!descricao.trim() || !responsavel.trim()) return;
    onAdd({
      id: newId(),
      descricao: descricao.trim(),
      responsavel: responsavel.trim(),
      prazo: prazo || undefined,
      concluida: false,
    });
    setDescricao('');
    setResponsavel('');
    setPrazo('');
  }

  return (
    <div className="stack">
      {ata.acoes.length === 0 ? (
        <p className="text-muted text-sm">Nenhuma ação registrada nesta ata.</p>
      ) : (
        ata.acoes.map((acao) => (
          <div className="card card-pad" key={acao.id}>
            <div className="row" style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <label className="row" style={{ gap: 8 }}>
                <input
                  type="checkbox"
                  checked={acao.concluida}
                  onChange={(e) => onUpdate(acao.id, { concluida: e.target.checked })}
                />
                <span style={{ textDecoration: acao.concluida ? 'line-through' : 'none' }}>{acao.descricao}</span>
              </label>
              <button
                className="btn btn-ghost btn-sm"
                disabled={!acao.prazo || !!acao.prazoId}
                onClick={() => onGerarPrazo(acao)}
              >
                {acao.prazoId ? 'Prazo gerado' : 'Gerar prazo'}
              </button>
            </div>
            <div className="text-muted text-sm" style={{ marginTop: 4 }}>
              Responsável: {acao.responsavel} · Prazo: {formatDateBR(acao.prazo)}
            </div>
          </div>
        ))
      )}

      <div className="form-row" style={{ marginTop: 8 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Descrição</label>
          <input className="input" value={descricao} onChange={(e) => setDescricao(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Responsável</label>
          <input className="input" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} />
        </div>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Prazo</label>
          <input className="input" type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </div>
      </div>
      <div>
        <button className="btn btn-primary" onClick={add}>
          + Adicionar ação
        </button>
      </div>
    </div>
  );
}
