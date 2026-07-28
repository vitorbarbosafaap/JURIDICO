export interface ComparativoLinha {
  tema: string;
  regimeAnterior: string;
  leiNova: string;
}

// Referência rápida para consulta durante a análise de casos — não substitui
// consulta ao texto legal integral. Regime anterior: Código Civil (arts.
// 757–802) + Decreto-Lei nº 73/66 + normativos SUSEP. Lei nova: Lei nº
// 15.040/2024 (Marco Legal dos Seguros), vigente para contratos celebrados a
// partir de 11/12/2025.
export const COMPARATIVO_LEI: ComparativoLinha[] = [
  {
    tema: 'Dever de informação na contratação',
    regimeAnterior: 'Art. 766, CC — declarações inexatas/omissas: perda da garantia se de má-fé; redução proporcional se de boa-fé.',
    leiNova: 'Art. 44 — dever de declarações verídicas mais detalhado, com consequências específicas para a formação e execução do contrato.',
  },
  {
    tema: 'Dever de informação sobre o sinistro',
    regimeAnterior: 'Tratamento genérico junto ao dever de mitigar o risco (art. 771, CC).',
    leiNova: 'Art. 66 — descumprimento doloso do dever de prestar informações sobre o sinistro acarreta perda do direito à indenização (§ 1º).',
  },
  {
    tema: 'Fraude na reclamação do sinistro',
    regimeAnterior: 'Sem disciplina específica; discutida via boa-fé objetiva e vedação ao enriquecimento sem causa.',
    leiNova: 'Art. 69, § 4º — fraude comprovada na reclamação do sinistro libera a seguradora do dever de indenizar.',
  },
  {
    tema: 'Prazo para regulação do sinistro',
    regimeAnterior: 'Sem prazo expresso em lei; praticado via normativo infralegal (Circular SUSEP nº 621/2021, art. 43 — 30 dias).',
    leiNova: 'Art. 87 — prazo de 30 dias passa a constar da própria lei, contado da entrega de toda a documentação.',
  },
  {
    tema: 'Princípio indenitário (vedação ao enriquecimento)',
    regimeAnterior: 'Arts. 778 e 781, CC — indenização limitada ao valor do interesse segurado e ao limite contratado.',
    leiNova: 'Mantido sem alteração de substância — a lei nova preserva o princípio indenitário do regime anterior.',
  },
  {
    tema: 'Interesse legítimo do segurado',
    regimeAnterior: 'Art. 782, CC — pressuposto de validade do contrato de seguro de dano.',
    leiNova: 'Mantido, com remissões mais expressas às consequências da ausência de interesse legítimo.',
  },
  {
    tema: 'Resolução do contrato pela seguradora',
    regimeAnterior: 'Disciplina esparsa; dependia fortemente das condições gerais de cada produto.',
    leiNova: 'Regras mais claras sobre comunicação e efeitos da resolução, inclusive em casos de fraude ou descumprimento de deveres do segurado.',
  },
  {
    tema: 'Aplicação subsidiária do CDC',
    regimeAnterior: 'Aplicável a contratos de seguro de consumo, por entendimento consolidado da jurisprudência.',
    leiNova: 'Mantida — a lei nova não afasta a incidência do CDC nas relações de consumo securitárias.',
  },
  {
    tema: 'Vigência para novos contratos',
    regimeAnterior: '—',
    leiNova: 'Aplica-se aos contratos celebrados a partir de 11/12/2025; contratos anteriores seguem o regime do Código Civil até o fim de sua vigência.',
  },
];
