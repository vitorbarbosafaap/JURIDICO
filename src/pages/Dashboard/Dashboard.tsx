import { Link } from 'react-router-dom';
import { Briefcase, AlarmClock, CalendarClock, TriangleAlert, Wallet } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { KpiCard } from '../../components/ui/KpiCard';
import { CategoricalBarChart } from '../../components/charts/CategoricalBarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { formatDateBR } from '../../lib/businessDays';
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
            <p className="text-muted text-sm">
              O módulo de Intimações (inbox + sugestão automática de prazo por tipo de peça) chega na
              Fase 2. Por ora, lance os prazos diretamente em{' '}
              <Link to="/prazos" style={{ color: 'var(--pitzi-accent-dark)', fontWeight: 600 }}>
                Prazos
              </Link>
              .
            </p>
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
              Integração com status de adesão ao ProConsumidor prevista para a Fase 5.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
