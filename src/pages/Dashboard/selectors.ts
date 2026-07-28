import type { Escritorio, Prazo, Processo, Seguradora } from '../../data/types';
import { classifyUrgency } from '../../lib/businessDays';

export function processosAtivos(processos: Processo[]): Processo[] {
  return processos.filter((p) => p.status !== 'Concluído');
}

export function prazosNoBucket(prazos: Prazo[], bucket: 'hoje' | 'semana' | 'vencido') {
  return prazos.filter((p) => p.status === 'pendente' && classifyUrgency(p.dataVencimento, p.status) === bucket);
}

export function exposicaoFinanceiraTotal(processos: Processo[]): number {
  return processosAtivos(processos).reduce((sum, p) => sum + (p.valorCausa ?? 0), 0);
}

export function porContingencia(processos: Processo[]) {
  const ativos = processosAtivos(processos);
  return ['Provável', 'Possível', 'Remota'].map((label) => ({
    label,
    value: ativos.filter((p) => p.contingencia === label).length,
  }));
}

export function porStatus(processos: Processo[]) {
  const statuses = ['Novo', 'Aguardando subsídio', 'Em defesa', 'Aguardando audiência', 'Concluído'];
  return statuses.map((label) => ({
    label,
    value: processos.filter((p) => p.status === label).length,
  }));
}

export function porSeguradora(processos: Processo[], seguradoras: Seguradora[]) {
  return seguradoras
    .map((s) => ({ label: s.nome, value: processos.filter((p) => p.seguradoraId === s.id).length }))
    .filter((d) => d.value > 0)
    .sort((a, b) => b.value - a.value);
}

export interface DesempenhoEscritorio {
  escritorio: Escritorio;
  casos: number;
  prazosCumpridos: number;
  prazosVencidos: number;
}

export function desempenhoPorEscritorio(
  escritorios: Escritorio[],
  processos: Processo[],
  prazos: Prazo[],
): DesempenhoEscritorio[] {
  return escritorios
    .filter((e) => e.tipo === 'externo')
    .map((e) => {
      const casos = processos.filter((p) => p.escritorioResponsavelId === e.id).length;
      const prazosDoEscritorio = prazos.filter((p) => p.responsavel === e.id);
      const prazosCumpridos = prazosDoEscritorio.filter((p) => p.status === 'cumprido').length;
      const prazosVencidos = prazosDoEscritorio.filter(
        (p) => p.status === 'pendente' && classifyUrgency(p.dataVencimento, p.status) === 'vencido',
      ).length;
      return { escritorio: e, casos, prazosCumpridos, prazosVencidos };
    })
    .filter((d) => d.casos > 0 || d.prazosCumpridos > 0 || d.prazosVencidos > 0);
}

export function casosProcon(processos: Processo[]) {
  return processos.filter((p) => p.tipoDemanda === 'PROCON' && p.status !== 'Concluído');
}

export function currencyBRL(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
