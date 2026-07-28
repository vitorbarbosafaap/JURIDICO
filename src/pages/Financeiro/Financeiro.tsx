import { useState } from 'react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { Tabs } from '../../components/ui/Tabs';
import { PagamentosTab } from './PagamentosTab';
import { CondenacoesTab } from './CondenacoesTab';
import { RelatorioTab } from './RelatorioTab';
import { condenacoesAtrasadas, pagamentosAtrasados } from './selectors';

const TABS = ['Pagamentos a Escritórios', 'Condenações', 'Relatório de Exposição'];

export function Financeiro() {
  const [tab, setTab] = useState(TABS[0]);
  const { items: pagamentos } = useCollection(repos.pagamentosEscritorio);
  const { items: condenacoes } = useCollection(repos.condenacoes);

  const atrasos = pagamentosAtrasados(pagamentos).length + condenacoesAtrasadas(condenacoes).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Financeiro</h2>
          <p className="desc">
            Controle consolidado de pagamentos a escritórios externos, condenações judiciais e exposição
            financeira.
          </p>
        </div>
      </div>

      {atrasos > 0 && (
        <div className="alert-banner">
          <span>⚠️</span>
          <span>
            {atrasos} pagamento{atrasos > 1 ? 's' : ''} em atraso — verifique os itens marcados nas abas abaixo.
          </span>
        </div>
      )}

      <Tabs tabs={TABS} active={tab} onChange={setTab} />
      {tab === 'Pagamentos a Escritórios' && <PagamentosTab />}
      {tab === 'Condenações' && <CondenacoesTab />}
      {tab === 'Relatório de Exposição' && <RelatorioTab />}
    </div>
  );
}
