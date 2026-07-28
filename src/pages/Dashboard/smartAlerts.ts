import type { CondenacaoJudicial, Escritorio, PagamentoEscritorio, Prazo, Processo } from '../../data/types';
import { classifyUrgency, todayISO } from '../../lib/businessDays';
import { currencyBRL, processosAtivos } from './selectors';
import { pagamentosAtrasados, condenacoesAtrasadas } from '../Financeiro/selectors';

export interface AlertaInteligente {
  id: string;
  severidade: 'alta' | 'media';
  titulo: string;
  detalhe: string;
}

const DIAS_SEM_MOVIMENTACAO = 30;

export function computeSmartAlerts(
  processos: Processo[],
  prazos: Prazo[],
  escritorios: Escritorio[],
  pagamentos: PagamentoEscritorio[],
  condenacoes: CondenacaoJudicial[],
): AlertaInteligente[] {
  const alerts: AlertaInteligente[] = [];
  const ativos = processosAtivos(processos);

  const semPrazo = ativos.filter((p) => !prazos.some((pr) => pr.processoId === p.id));
  if (semPrazo.length > 0) {
    alerts.push({
      id: 'sem-prazo',
      severidade: 'alta',
      titulo: `${semPrazo.length} processo(s) ativo(s) sem nenhum prazo cadastrado`,
      detalhe: semPrazo
        .slice(0, 4)
        .map((p) => p.numeroCNJ || p.tribunalVara || p.tipoDemanda)
        .join(', '),
    });
  }

  const hoje = todayISO();
  const semMovimentacao = ativos.filter((p) => {
    const ultima = p.timeline[p.timeline.length - 1]?.at ?? p.updatedAt;
    const dias = Math.floor((new Date(hoje).getTime() - new Date(ultima).getTime()) / 86_400_000);
    return dias >= DIAS_SEM_MOVIMENTACAO;
  });
  if (semMovimentacao.length > 0) {
    alerts.push({
      id: 'sem-movimentacao',
      severidade: 'media',
      titulo: `${semMovimentacao.length} processo(s) sem movimentação há mais de ${DIAS_SEM_MOVIMENTACAO} dias`,
      detalhe: semMovimentacao
        .slice(0, 4)
        .map((p) => p.numeroCNJ || p.tribunalVara || p.tipoDemanda)
        .join(', '),
    });
  }

  const desempenhoRuim = escritorios
    .filter((e) => e.tipo === 'externo')
    .map((e) => {
      const doEscritorio = prazos.filter((p) => p.responsavel === e.id);
      const cumpridos = doEscritorio.filter((p) => p.status === 'cumprido').length;
      const vencidos = doEscritorio.filter(
        (p) => p.status === 'pendente' && classifyUrgency(p.dataVencimento, p.status) === 'vencido',
      ).length;
      return { escritorio: e, cumpridos, vencidos };
    })
    .filter((d) => d.vencidos > 0 && d.vencidos >= d.cumpridos);
  if (desempenhoRuim.length > 0) {
    alerts.push({
      id: 'desempenho-escritorio',
      severidade: 'alta',
      titulo: `${desempenhoRuim.length} escritório(s) com mais prazos vencidos do que cumpridos`,
      detalhe: desempenhoRuim.map((d) => `${d.escritorio.nome} (${d.vencidos} vencido(s))`).join(', '),
    });
  }

  const pagAtrasados = pagamentosAtrasados(pagamentos);
  const condAtrasadas = condenacoesAtrasadas(condenacoes);
  if (pagAtrasados.length > 0 || condAtrasadas.length > 0) {
    const total =
      pagAtrasados.reduce((s, p) => s + p.valor, 0) + condAtrasadas.reduce((s, c) => s + c.valor, 0);
    alerts.push({
      id: 'financeiro-atrasado',
      severidade: 'alta',
      titulo: `${pagAtrasados.length + condAtrasadas.length} pagamento(s)/condenação(ões) em atraso`,
      detalhe: `Total em atraso: ${currencyBRL(total)}. Veja o módulo Financeiro para detalhes.`,
    });
  }

  return alerts;
}
