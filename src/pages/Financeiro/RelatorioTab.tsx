import { Wallet, Landmark, Gavel } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { KpiCard } from '../../components/ui/KpiCard';
import { CategoricalBarChart } from '../../components/charts/CategoricalBarChart';
import { DonutChart } from '../../components/charts/DonutChart';
import { currencyBRL, exposicaoFinanceiraTotal, porContingencia } from '../Dashboard/selectors';
import { pendentesEAtrasadosPorEscritorio, totalNaoPagoCondenacoes, totalNaoPagoPagamentos } from './selectors';

export function RelatorioTab() {
  const { items: processos } = useCollection(repos.processos);
  const { items: pagamentos } = useCollection(repos.pagamentosEscritorio);
  const { items: condenacoes } = useCollection(repos.condenacoes);
  const { items: escritorios } = useCollection(repos.escritorios);

  return (
    <div>
      <div className="kpi-grid">
        <KpiCard
          label="Exposição Financeira Total"
          value={currencyBRL(exposicaoFinanceiraTotal(processos))}
          icon={<Wallet size={14} />}
        />
        <KpiCard
          label="Total Pendente a Escritórios"
          value={currencyBRL(totalNaoPagoPagamentos(pagamentos))}
          icon={<Landmark size={14} />}
        />
        <KpiCard
          label="Total Condenações Pendentes"
          value={currencyBRL(totalNaoPagoCondenacoes(condenacoes))}
          icon={<Gavel size={14} />}
        />
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Exposição por contingência</div>
              <div className="card-sub">Processos ativos — provável, possível, remota</div>
            </div>
          </div>
          <div className="card-pad">
            <DonutChart data={porContingencia(processos)} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Pendências por escritório</div>
              <div className="card-sub">Pagamentos pendentes + atrasados, por escritório externo</div>
            </div>
          </div>
          <div className="card-pad">
            <CategoricalBarChart data={pendentesEAtrasadosPorEscritorio(pagamentos, escritorios)} />
          </div>
        </div>
      </div>
    </div>
  );
}
