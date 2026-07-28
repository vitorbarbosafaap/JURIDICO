import type { CategoricalDatum } from '../../components/charts/CategoricalBarChart';
import type { CondenacaoJudicial, Escritorio, PagamentoEscritorio, StatusPagamento } from '../../data/types';
import { todayISO } from '../../lib/businessDays';

/** An item is effectively late when it isn't paid yet and its date has passed,
 * even if the stored status field hasn't been manually flipped to 'atrasado'. */
export function isComputedLate(status: StatusPagamento, dataISO: string): boolean {
  return status !== 'pago' && dataISO < todayISO();
}

export function effectiveStatus(status: StatusPagamento, dataISO: string): StatusPagamento {
  return isComputedLate(status, dataISO) ? 'atrasado' : status;
}

export function pagamentosAtrasados(pagamentos: PagamentoEscritorio[]): PagamentoEscritorio[] {
  return pagamentos.filter((p) => isComputedLate(p.status, p.vencimento));
}

export function condenacoesAtrasadas(condenacoes: CondenacaoJudicial[]): CondenacaoJudicial[] {
  return condenacoes.filter((c) => isComputedLate(c.status, c.prazoPagamento));
}

export function totalNaoPagoPagamentos(pagamentos: PagamentoEscritorio[]): number {
  return pagamentos.filter((p) => p.status !== 'pago').reduce((sum, p) => sum + p.valor, 0);
}

export function totalNaoPagoCondenacoes(condenacoes: CondenacaoJudicial[]): number {
  return condenacoes.filter((c) => c.status !== 'pago').reduce((sum, c) => sum + c.valor, 0);
}

export function pendentesEAtrasadosPorEscritorio(
  pagamentos: PagamentoEscritorio[],
  escritorios: Escritorio[],
): CategoricalDatum[] {
  return escritorios
    .map((e) => {
      const valor = pagamentos
        .filter((p) => p.escritorioId === e.id)
        .filter((p) => {
          const eff = effectiveStatus(p.status, p.vencimento);
          return eff === 'pendente' || eff === 'atrasado';
        })
        .reduce((sum, p) => sum + p.valor, 0);
      return { label: e.nome, value: Math.round(valor) };
    })
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}
