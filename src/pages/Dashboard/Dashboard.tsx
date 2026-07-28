import { Link } from 'react-router-dom';
import { Briefcase, AlarmClock, CalendarClock, TriangleAlert, Wallet, ShieldAlert } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { KpiCard } from '../../components/ui/KpiCard';
import { CategoricalBarChart } from '../../components/charts/CategoricalBarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { formatDateBR } from '../../lib/businessDays';
import { computeSmartAlerts } from './smartAlerts';
import {
  casosProcon,
  currencyBRL,
  desempenhoPorEscritorio,
  exposicaoFinanceiraTotal,
  porContingencia,
  porSeguradora,
  porStatus,
  prazosNoBucket,
  processosAtivos,
} from './selectors';

export function Dashboard() {
  const { items: processos } = useCollection(repos.processos);
  const { items: prazos } = useCollection(repos.prazos);
  const { items: escritorios } = useCollection(repos.escritorios);
  const { items: seguradoras } = useCollection(repos.seguradoras);
  const { items: intimacoes } = useCollection(repos.intimacoes);
  const { items: pagamentosEscritorio } = useCollection(repos.pagamentosEscritorio);
  const { items: condenacoes } = useCollection(repos.condenacoes);

  const alertas = computeSmartAlerts(processos, prazos, escritorios, pagamentosEscritorio, condenacoes);
  const intimacoesRecentes = intimacoes
    .slice()
    .sort((a, b) => b.recebidoEm.localeCompare(a.recebidoEm))
    .slice(0, 4);

  const ativos = processosAtivos(processos);
  const hoje = prazosNoBucket(prazos, 'hoje');
  const semana = prazosNoBucket(prazos, 'semana');
  const vencidos = prazosNoBucket(prazos, 'vencido');
  const desempenho = desempenhoPorEscritorio(escritorios, processos, prazos);
  const procon = casosProcon(processos);
  const prazosProcon = prazos.filter(
    (p) => p.status === 'pendente' && procon.some((c) => c.id === p.processoId),
  );

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard label="Processos Ativos" value={ativos.length} icon={<Briefcase size={14} />} />
        <KpiCard
          label="Prazos Hoje"
          value={hoje.length}
          warn={hoje.length > 0}
          icon={<AlarmClock size={14} />}
        />
        <KpiCard label="Prazos na Semana" value={semana.length} icon={<CalendarClock size={14} />} />
        <KpiCard
          label="Casos Atrasados"
          value={vencidos.length}
          warn={vencidos.length > 0}
          icon={<TriangleAlert size={14} />}
        />
        <KpiCard
          label="Exposição Financeira Total"
          value={currencyBRL(exposicaoFinanceiraTotal(processos))}
          icon={<Wallet size={14} />}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Casos por status</div>
              <div className="card-sub">Distribuição do funil processual</div>
            </div>
          </div>
          <div className="card-pad">
            <CategoricalBarChart data={porStatus(processos)} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Casos por contingência</div>
              <div className="card-sub">Processos ativos</div>
            </div>
          </div>
          <div className="card-pad">
            <DonutChart data={porContingencia(processos)} />
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Casos por seguradora / parceiro comercial</div>
              <div className="card-sub">Kakau, Generali, Gazin, Mapfre e outros</div>
            </div>
          </div>
          <div className="card-pad">
            <CategoricalBarChart data={porSeguradora(processos, seguradoras)} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Performance por escritório externo</div>
              <div className="card-sub">Viseu, CGV, Jorge Masanobu Baffi Onishi</div>
            </div>
          </div>
          <div className="card-pad">
            {desempenho.length === 0 ? (
              <p className="text-muted text-sm">Sem casos vinculados a escritórios externos ainda.</p>
            ) : (
              <div className="table-wrap" style={{ border: 'none' }}>
                <table className="table">
                  <thead>
                    <tr>
                      <th>Escritório</th>
                      <th>Casos</th>
                      <th>Prazos cumpridos</th>
                      <th>Prazos vencidos</th>
                    </tr>
                  </thead>
                  <tbody>
                    {desempenho.map((d) => (
                      <tr key={d.escritorio.id} style={{ cursor: 'default' }}>
                        <td>{d.escritorio.nome}</td>
                        <td>{d.casos}</td>
                        <td>{d.prazosCumpridos}</td>
                        <td style={{ color: d.prazosVencidos > 0 ? 'var(--pitzi-warn)' : undefined }}>
                          {d.prazosVencidos}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <p className="text-muted text-sm" style={{ marginTop: 10 }}>
              Tempo médio de resposta entra no painel assim que houver histórico suficiente de
              comunicações por processo.
            </p>
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Intimações recentes</div>
              <div className="card-sub">Lançamento manual e sugestão automática de prazo</div>
            </div>
          </div>
          <div className="card-pad">
            {intimacoesRecentes.length === 0 ? (
              <p className="text-muted text-sm">
                Nenhuma intimação registrada ainda. Lance a primeira em{' '}
                <Link to="/intimacoes" style={{ color: 'var(--pitzi-accent-dark)', fontWeight: 600 }}>
                  Intimações
                </Link>
                .
              </p>
            ) : (
              <div className="stack">
                {intimacoesRecentes.map((i) => (
                  <div key={i.id} className="row" style={{ justifyContent: 'space-between', fontSize: 12.5 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{i.tipoAcao}</div>
                      <div className="text-muted">{i.tribunalVara || '—'}</div>
                    </div>
                    <div className="text-muted">{formatDateBR(i.recebidoEm)}</div>
                  </div>
                ))}
                <Link to="/intimacoes" style={{ color: 'var(--pitzi-accent-dark)', fontWeight: 600, fontSize: 12.5 }}>
                  Ver todas →
                </Link>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">PROCON / Senacon</div>
              <div className="card-sub">Casos abertos e prazos de defesa</div>
            </div>
          </div>
          <div className="card-pad">
            <div className="row" style={{ gap: 24, marginBottom: 12 }}>
              <div>
                <div className="text-muted text-sm">Casos abertos</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{procon.length}</div>
              </div>
              <div>
                <div className="text-muted text-sm">Prazos de defesa pendentes</div>
                <div style={{ fontSize: 22, fontWeight: 800 }}>{prazosProcon.length}</div>
              </div>
            </div>
            {prazosProcon.length > 0 && (
              <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12.5 }}>
                {prazosProcon.slice(0, 4).map((p) => (
                  <li key={p.id}>
                    {p.tipo} — vence em {formatDateBR(p.dataVencimento)}
                  </li>
                ))}
              </ul>
            )}
            <p className="text-muted text-sm" style={{ marginTop: 10 }}>
              Checklist de conformidade e status de adesão ao ProConsumidor em{' '}
              <Link to="/compliance" style={{ color: 'var(--pitzi-accent-dark)', fontWeight: 600 }}>
                Compliance
              </Link>
              .
            </p>
          </div>
        </div>
      </div>

      {alertas.length > 0 && (
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Alertas inteligentes</div>
              <div className="card-sub">Riscos identificados automaticamente a partir dos dados atuais</div>
            </div>
          </div>
          <div className="card-pad">
            <div className="stack">
              {alertas.map((a) => (
                <div
                  key={a.id}
                  className="row"
                  style={{
                    alignItems: 'flex-start',
                    gap: 10,
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: a.severidade === 'alta' ? 'var(--pitzi-warn-bg)' : 'var(--pitzi-amber-bg)',
                  }}
                >
                  <ShieldAlert
                    size={16}
                    style={{ marginTop: 1, flex: 'none' }}
                    color={a.severidade === 'alta' ? 'var(--pitzi-warn)' : 'var(--pitzi-amber)'}
                  />
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{a.titulo}</div>
                    <div className="text-muted text-sm">{a.detalhe}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
