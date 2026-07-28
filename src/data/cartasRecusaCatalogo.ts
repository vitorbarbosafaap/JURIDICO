// Catálogo de hipóteses para a Carta de Resposta à Regulação de Sinistro e
// Notificação de Resolução do Contrato de Proteção, nos termos da Lei nº
// 15.040/2024 (Marco Legal dos Seguros). Organizado pelas categorias do
// briefing: documentação fiscal, caracterização do evento, dever de
// informação (art. 66), interesse legítimo e princípio indenitário.

import type { Genero } from './types';

export type CartaVars = Record<string, string>;

export function esc(s: string | undefined | null): string {
  return (s === undefined || s === null ? '' : String(s)).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
export function V(val: string | undefined, ph: string): string {
  const s = (val === undefined || val === null ? '' : String(val)).trim();
  return s ? esc(s) : `<span class="ph">${esc(ph)}</span>`;
}

const MESES = [
  'janeiro', 'fevereiro', 'março', 'abril', 'maio', 'junho',
  'julho', 'agosto', 'setembro', 'outubro', 'novembro', 'dezembro',
];
export function D(val: string | undefined, ph?: string): string {
  if (!val) return `<span class="ph">${esc(ph || 'data')}</span>`;
  const [y, m, d] = val.split('-').map(Number);
  if (!y || !m || !d) return esc(val);
  return `${String(d).padStart(2, '0')} de ${MESES[m - 1]} de ${y}`;
}
export function todayLong(): string {
  const d = new Date();
  return `${String(d.getDate()).padStart(2, '0')} de ${MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

/** Concordância de gênero: G(masculino, feminino, genero) */
export function G(masc: string, fem: string, genero: Genero): string {
  return genero === 'feminino' ? fem : masc;
}

export function tratamentoFormal(genero: Genero): string {
  return G('o Sr.', 'a Sra.', genero);
}
export function segurado(genero: Genero): string {
  return G('o segurado', 'a segurada', genero);
}
export function seguradoCap(genero: Genero): string {
  return G('O segurado', 'A segurada', genero);
}

export interface HipoteseRecusa {
  id: string;
  label: string;
  quandoUsar: string;
  camposExtras: { key: string; label: string; type: 'text' | 'date' | 'textarea'; ph?: string }[];
  corpo: (v: CartaVars, genero: Genero) => string;
  fundamentoLegal: string;
}

export interface CategoriaRecusa {
  id: string;
  titulo: string;
  descricao: string;
  hipoteses: HipoteseRecusa[];
}

export const CATEGORIAS_RECUSA: CategoriaRecusa[] = [
  {
    id: 'documentacao_fiscal',
    titulo: 'Documentação fiscal',
    descricao: 'Inconsistências na comprovação fiscal de aquisição do bem segurado.',
    hipoteses: [
      {
        id: 'nf_incompativel',
        label: 'Nota fiscal incompatível com o bem sinistrado ou com a contratação',
        quandoUsar: 'A nota fiscal apresentada não corresponde ao bem, à data de contratação ou ao titular da apólice.',
        camposExtras: [
          { key: 'descricaoBem', label: 'Descrição do bem segurado', type: 'text' },
          { key: 'dataContratacao', label: 'Data de contratação do seguro', type: 'date' },
          { key: 'dataNotaFiscal', label: 'Data de emissão da nota fiscal', type: 'date' },
          { key: 'inconsistencia', label: 'Descreva a inconsistência identificada', type: 'textarea' },
        ],
        fundamentoLegal: 'Arts. 44 e 69, § 4º, da Lei nº 15.040/2024',
        corpo: (v, g) => `
          <p>Na regulação do sinistro comunicado, esta seguradora identificou que a nota fiscal apresentada para comprovação da titularidade e do valor do bem segurado (${V(v.descricaoBem, 'descrição do bem')}) não é compatível com os dados da contratação, notadamente quanto às datas envolvidas: o seguro foi contratado em ${D(v.dataContratacao, 'data de contratação')}, ao passo que a nota fiscal apresentada foi emitida em ${D(v.dataNotaFiscal, 'data da nota fiscal')}.</p>
          <p>${V(v.inconsistencia, 'Descreva aqui a inconsistência específica identificada na documentação fiscal apresentada.')}</p>
          <p>O art. 44 da Lei nº 15.040/2024 impõe ao proponente e ao segurado o dever de prestar declarações verídicas na formação e na execução do contrato de seguro, sob pena de perda da garantia. A apresentação de documento fiscal incompatível com os elementos objetivos da contratação, quando utilizada para fins de comprovação de sinistro, caracteriza fraude na reclamação do sinistro, nos termos do art. 69, § 4º, da mesma lei, o que libera a seguradora do dever de indenizar.</p>`,
      },
      {
        id: 'ausencia_comprovacao',
        label: 'Ausência de comprovação fiscal de propriedade do bem',
        quandoUsar: 'O segurado não apresentou nenhuma nota fiscal ou documento equivalente comprovando a titularidade do bem.',
        camposExtras: [
          { key: 'descricaoBem', label: 'Descrição do bem segurado', type: 'text' },
          { key: 'prazoConcedido', label: 'Prazo concedido para regularização (dias)', type: 'text', ph: 'ex.: 30' },
        ],
        fundamentoLegal: 'Art. 771 do Código Civil c/c art. 66 da Lei nº 15.040/2024',
        corpo: (v, g) => `
          <p>Notificamos que, até a presente data, não foi apresentada nota fiscal, contrato de compra e venda ou qualquer outro documento hábil a comprovar a titularidade do bem segurado (${V(v.descricaoBem, 'descrição do bem')}), documentação indispensável à regulação do sinistro comunicado.</p>
          <p>Foi concedido a ${tratamentoFormal(g)} prazo de ${V(v.prazoConcedido, '30')} dias para a regularização da pendência documental, sem que houvesse manifestação ou apresentação da documentação solicitada.</p>
          <p>O art. 771 do Código Civil determina que o segurado comunique o sinistro e adote as providências para minorar suas consequências, o que inclui a comprovação regular da titularidade do bem. Ante a ausência de comprovação documental mínima, esta seguradora não possui elementos objetivos para prosseguir com a regulação e a indenização do sinistro.</p>`,
      },
    ],
  },
  {
    id: 'caracterizacao_evento',
    titulo: 'Caracterização do evento',
    descricao: 'O evento comunicado não corresponde aos riscos efetivamente cobertos pela apólice.',
    hipoteses: [
      {
        id: 'fora_cobertura',
        label: 'Evento relatado fora do risco coberto pela apólice',
        quandoUsar: 'O sinistro comunicado (ex.: roubo/furto) não está entre as coberturas efetivamente contratadas (ex.: apenas quebra acidental).',
        camposExtras: [
          { key: 'coberturaContratada', label: 'Cobertura efetivamente contratada', type: 'text' },
          { key: 'eventoRelatado', label: 'Evento relatado na comunicação de sinistro', type: 'text' },
        ],
        fundamentoLegal: 'Art. 757 do Código Civil c/c condições gerais da apólice',
        corpo: (v, g) => `
          <p>A apólice/bilhete de seguro contratado estabelece, de forma expressa e clara, que a cobertura contratada compreende exclusivamente ${V(v.coberturaContratada, 'a cobertura contratada')}.</p>
          <p>O evento comunicado por ${tratamentoFormal(g)} — ${V(v.eventoRelatado, 'evento relatado')} — não se enquadra no risco especificamente coberto pela apólice, circunstância que impede o pagamento da indenização pleiteada, sob pena de desvirtuamento do objeto do contrato de seguro, cuja obrigação da seguradora é circunscrita ao risco predeterminado e aceito no momento da contratação (art. 757 do Código Civil).</p>
          <p>Não se trata de recusa arbitrária, mas de estrita observância aos limites objetivos do risco assumido, os quais foram levados ao conhecimento de ${segurado(g)} no ato da contratação, através do bilhete de seguro e das Condições Gerais.</p>`,
      },
      {
        id: 'furto_simples',
        label: 'Furto simples comunicado como se fosse furto/roubo qualificado',
        quandoUsar: 'O Boletim de Ocorrência descreve furto simples (sem arrombamento/violência), hipótese fora da cobertura de roubo/furto qualificado.',
        camposExtras: [
          { key: 'dataEvento', label: 'Data do evento', type: 'date' },
        ],
        fundamentoLegal: 'Condições Gerais da apólice — cobertura restrita a roubo/furto qualificado',
        corpo: (v, g) => `
          <p>Em ${D(v.dataEvento, 'data do evento')}, foi comunicado a esta seguradora o furto do bem segurado. Da análise do Boletim de Ocorrência apresentado, verifica-se que o fato foi registrado como furto simples, sem indicação de rompimento de obstáculo, arrombamento ou emprego de violência ou grave ameaça.</p>
          <p>As Condições Gerais da apólice preveem cobertura exclusivamente para os eventos de roubo ou furto qualificado, não se estendendo à hipótese de furto simples, tal qual descrito no boletim de ocorrência apresentado por ${tratamentoFormal(g)}.</p>
          <p>Esta seguradora permanece à disposição para reanálise do sinistro caso sejam apresentados elementos adicionais (imagens, testemunhas ou laudo complementar) que evidenciem circunstância de violência ou arrombamento não constante do registro policial original.</p>`,
      },
    ],
  },
  {
    id: 'dever_informacao',
    titulo: 'Dever de informação (art. 66)',
    descricao: 'Descumprimento do dever de prestar informações sobre as circunstâncias e consequências do sinistro.',
    hipoteses: [
      {
        id: 'omissao_dolosa',
        label: 'Omissão dolosa de informações relevantes sobre o sinistro',
        quandoUsar: 'O segurado omitiu ou prestou informações inverídicas sobre as circunstâncias do sinistro, identificadas na regulação.',
        camposExtras: [
          { key: 'descricaoOmissao', label: 'Descreva a omissão/informação inverídica identificada', type: 'textarea' },
        ],
        fundamentoLegal: 'Art. 66, § 1º, da Lei nº 15.040/2024',
        corpo: (v, g) => `
          <p>Na regulação do sinistro comunicado, esta seguradora apurou que ${tratamentoFormal(g)} deixou de prestar, de forma dolosa, informações relevantes sobre as circunstâncias e consequências do evento, em descumprimento ao dever de cooperação que lhe competia.</p>
          <p>${V(v.descricaoOmissao, 'Descreva aqui a omissão ou informação inverídica identificada durante a regulação.')}</p>
          <p>O art. 66, § 1º, da Lei nº 15.040/2024 estabelece que o descumprimento doloso, por parte do segurado, do dever de prestar as informações necessárias sobre o sinistro e suas consequências acarreta a perda do direito à indenização. Diante da constatação objetiva acima descrita, esta seguradora comunica a perda do direito à garantia securitária no presente caso.</p>`,
      },
    ],
  },
  {
    id: 'interesse_legitimo',
    titulo: 'Interesse legítimo',
    descricao: 'Ausência de interesse segurável legítimo sobre o bem ou risco objeto do sinistro.',
    hipoteses: [
      {
        id: 'sem_interesse',
        label: 'Ausência de interesse legítimo sobre o bem segurado',
        quandoUsar: 'Verificou-se que o proponente/segurado não detinha interesse legítimo (propriedade, posse ou responsabilidade) sobre o bem no momento da contratação ou do sinistro.',
        camposExtras: [
          { key: 'descricaoBem', label: 'Descrição do bem segurado', type: 'text' },
          { key: 'apuracao', label: 'Descreva o que foi apurado sobre a titularidade/posse', type: 'textarea' },
        ],
        fundamentoLegal: 'Art. 782 do Código Civil c/c art. 47 da Lei nº 15.040/2024',
        corpo: (v, g) => `
          <p>A regulação do sinistro relativo ao bem ${V(v.descricaoBem, 'descrição do bem')} identificou que ${tratamentoFormal(g)} não detinha, no momento relevante, interesse legítimo — seja a título de propriedade, posse ou responsabilidade — sobre o bem objeto da contratação.</p>
          <p>${V(v.apuracao, 'Descreva aqui os elementos apurados sobre a ausência de interesse legítimo.')}</p>
          <p>Nos termos do art. 782 do Código Civil, o interesse legítimo do segurado é elemento essencial e pressuposto de validade do contrato de seguro de dano, sem o qual não subsiste a obrigação da seguradora de indenizar. A ausência desse pressuposto, apurada na presente regulação, impede o pagamento da indenização pleiteada.</p>`,
      },
    ],
  },
  {
    id: 'principio_indenitario',
    titulo: 'Princípio indenitário',
    descricao: 'A indenização pleiteada extrapola o limite máximo indenizável ou já foi anteriormente satisfeita.',
    hipoteses: [
      {
        id: 'lmi_excedido',
        label: 'Pretensão indenizatória superior ao Limite Máximo de Indenização (LMI)',
        quandoUsar: 'O valor pleiteado ou o bem de reposição pretendido excede o LMI contratado.',
        camposExtras: [
          { key: 'lmi', label: 'Limite Máximo de Indenização contratado (R$)', type: 'text' },
          { key: 'valorPleiteado', label: 'Valor/bem pleiteado', type: 'text' },
        ],
        fundamentoLegal: 'Arts. 778 e 781 do Código Civil (princípio indenitário)',
        corpo: (v, g) => `
          <p>O bilhete de seguro contratado estabelece o Limite Máximo de Indenização (LMI) de R$ ${V(v.lmi, 'valor do LMI')} para a cobertura acionada. A pretensão apresentada por ${tratamentoFormal(g)} (${V(v.valorPleiteado, 'valor/bem pleiteado')}) excede o limite contratualmente estabelecido.</p>
          <p>Os arts. 778 e 781 do Código Civil consagram o princípio indenitário, segundo o qual a indenização securitária não pode ultrapassar o valor do interesse segurado no momento do sinistro, nem o limite máximo de garantia fixado no contrato, sob pena de ensejar enriquecimento sem causa do segurado. Nesse sentido, esta seguradora confirma a indenização até o limite contratado de R$ ${V(v.lmi, 'valor do LMI')}, sendo inviável o atendimento da pretensão no montante que o excede.</p>`,
      },
      {
        id: 'ja_indenizado',
        label: 'Sinistro já integralmente indenizado (extinção da cobertura)',
        quandoUsar: 'O LMI já foi consumido em atendimento anterior, extinguindo a cobertura para novos eventos no período de vigência.',
        camposExtras: [
          { key: 'dataIndenizacaoAnterior', label: 'Data da indenização anterior', type: 'date' },
        ],
        fundamentoLegal: 'Arts. 776 e 781 do Código Civil',
        corpo: (v, g) => `
          <p>Consta dos registros desta seguradora que, em ${D(v.dataIndenizacaoAnterior, 'data')}, já foi processada e paga a indenização integral relativa ao bem segurado, consumindo o Limite Máximo de Indenização (LMI) contratado.</p>
          <p>Nos termos dos arts. 776 e 781 do Código Civil, uma vez indenizado integralmente o interesse segurado até o limite contratado, extingue-se a garantia para o período de vigência remanescente, não sendo cabível o pagamento de nova indenização sobre o mesmo bem sem a contratação de nova apólice ou aditivo específico.</p>`,
      },
    ],
  },
];

export function findHipotese(categoriaId: string, hipoteseId: string): HipoteseRecusa | undefined {
  return CATEGORIAS_RECUSA.find((c) => c.id === categoriaId)?.hipoteses.find((h) => h.id === hipoteseId);
}
