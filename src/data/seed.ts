import { newId } from './repository';
import { addBusinessDays, buildHolidaySet } from '../lib/businessDays';
import type {
  AppConfig,
  Cliente,
  Escritorio,
  EventoAgenda,
  Prazo,
  Processo,
  Seguradora,
  TipoPecaConfig,
} from './types';
import type { repos as ReposType } from './db';

const SEED_FLAG_KEY = 'pitzi-juridico:v1:seeded';

const DEFAULT_TIPOS_PECA: Omit<TipoPecaConfig, 'id'>[] = [
  { tipo: 'Contestação', diasUteis: 15 },
  { tipo: 'Réplica', diasUteis: 15 },
  { tipo: 'Manifestação', diasUteis: 5 },
  { tipo: 'Defesa PROCON', diasUteis: 10 },
  { tipo: 'Recurso Ordinário', diasUteis: 8 },
  { tipo: 'Agravo de Instrumento', diasUteis: 15 },
  { tipo: 'Embargos de Declaração', diasUteis: 5 },
  { tipo: 'Alegações Finais', diasUteis: 10 },
  { tipo: 'Recurso Especial', diasUteis: 15 },
  { tipo: 'Cumprimento de Sentença - Manifestação', diasUteis: 15 },
  { tipo: 'Habeas Corpus - Recurso', diasUteis: 5 },
];

function isoDaysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export async function seedIfEmpty(
  repos: typeof ReposType,
  getConfig: () => Promise<AppConfig>,
  saveConfig: (c: AppConfig) => Promise<void>,
): Promise<void> {
  if (window.localStorage.getItem(SEED_FLAG_KEY)) return;

  const existingProcessos = await repos.processos.list(true);
  if (existingProcessos.length > 0) {
    window.localStorage.setItem(SEED_FLAG_KEY, '1');
    return;
  }

  const now = new Date().toISOString();

  const escritorios: Escritorio[] = [
    {
      id: newId(),
      nome: 'Jurídico Interno',
      tipo: 'interno',
      contatos: [],
    },
    {
      id: newId(),
      nome: 'Viseu Advogados',
      tipo: 'externo',
      contatos: [
        { id: newId(), nome: 'Nadjane Reis', cargo: 'Advogada', email: '' },
        { id: newId(), nome: 'Gustavo Murakami', cargo: 'Advogado', email: '' },
      ],
    },
    {
      id: newId(),
      nome: 'CGV Advogados',
      tipo: 'externo',
      contatos: [
        { id: newId(), nome: 'Ana Urbani', cargo: 'Advogada', email: '' },
        { id: newId(), nome: 'Vivian Duarte', cargo: 'Advogada', email: '' },
      ],
    },
    {
      id: newId(),
      nome: 'Jorge Masanobu Baffi Onishi',
      tipo: 'externo',
      contatos: [{ id: newId(), nome: 'Jorge Masanobu Baffi Onishi', cargo: 'Advogado' }],
    },
  ];

  const seguradoras: Seguradora[] = [
    { id: newId(), nome: 'Kakau', cnpj: '', susep: '', observacoes: 'CNPJ/SUSEP a confirmar em Configurações' },
    { id: newId(), nome: 'Generali Brasil', cnpj: '', susep: '', observacoes: 'CNPJ/SUSEP a confirmar em Configurações' },
    { id: newId(), nome: 'Gazin Seguros', cnpj: '', susep: '', observacoes: 'CNPJ/SUSEP a confirmar em Configurações' },
    { id: newId(), nome: 'Mapfre', cnpj: '', susep: '', observacoes: 'CNPJ/SUSEP a confirmar em Configurações' },
  ];

  const [interno, viseu, cgv, jorge] = escritorios;
  const [kakau, generali, gazin, mapfre] = seguradoras;

  const clientes: Cliente[] = [
    { id: newId(), nome: 'Cliente Exemplo 1', cpf: '', telefone: '', email: '', canalAquisicao: 'Amazon', createdAt: now },
    { id: newId(), nome: 'Cliente Exemplo 2', cpf: '', telefone: '', email: '', canalAquisicao: 'Gazin', createdAt: now },
    { id: newId(), nome: 'Cliente Exemplo 3', cpf: '', telefone: '', email: '', canalAquisicao: 'PagBank', createdAt: now },
    { id: newId(), nome: 'Cliente Exemplo 4', cpf: '', telefone: '', email: '', canalAquisicao: 'Direto', createdAt: now },
  ];

  function novoProcesso(p: Partial<Processo> & Pick<Processo, 'tipoDemanda' | 'contingencia' | 'status'>): Processo {
    return {
      id: newId(),
      numeroCNJ: '',
      tribunalVara: '',
      clienteId: undefined,
      valorCausa: 0,
      escritorioResponsavelId: interno.id,
      canalVenda: 'Direto',
      produto: 'Device Protection',
      createdAt: now,
      updatedAt: now,
      timeline: [{ id: newId(), at: now, texto: 'Processo cadastrado no sistema.' }],
      documentos: [],
      comunicacoes: [],
      financeiro: [],
      auditoria: [{ id: newId(), at: now, autor: 'Sistema', acao: 'Criação', detalhe: 'Registro inicial (seed).' }],
      ...p,
    };
  }

  const processos: Processo[] = [
    novoProcesso({
      tipoDemanda: 'PROCON',
      contingencia: 'Provável',
      status: 'Aguardando subsídio',
      clienteId: clientes[0].id,
      escritorioResponsavelId: interno.id,
      tribunalVara: 'PROCON-SP',
      valorCausa: 3200,
      canalVenda: 'Amazon',
      seguradoraId: kakau.id,
    }),
    novoProcesso({
      tipoDemanda: 'Judicial',
      contingencia: 'Possível',
      status: 'Em defesa',
      clienteId: clientes[1].id,
      escritorioResponsavelId: viseu.id,
      tribunalVara: '3ª Vara Cível — TJSP',
      valorCausa: 8500,
      canalVenda: 'Gazin',
      seguradoraId: gazin.id,
    }),
    novoProcesso({
      tipoDemanda: 'JEC',
      contingencia: 'Remota',
      status: 'Novo',
      clienteId: clientes[2].id,
      escritorioResponsavelId: cgv.id,
      tribunalVara: 'JEC Central — TJSP',
      valorCausa: 4100,
      canalVenda: 'PagBank',
      seguradoraId: generali.id,
    }),
    novoProcesso({
      tipoDemanda: 'Sinistro',
      contingencia: 'Provável',
      status: 'Aguardando audiência',
      clienteId: clientes[3].id,
      escritorioResponsavelId: jorge.id,
      tribunalVara: '5ª Vara do Juizado Especial',
      valorCausa: 2600,
      canalVenda: 'Direto',
      seguradoraId: mapfre.id,
    }),
    novoProcesso({
      tipoDemanda: 'Judicial',
      contingencia: 'Possível',
      status: 'Concluído',
      clienteId: clientes[0].id,
      escritorioResponsavelId: viseu.id,
      tribunalVara: '12ª Vara Cível — TJSP',
      valorCausa: 5400,
      canalVenda: 'Amazon',
      seguradoraId: kakau.id,
    }),
  ];

  const holidays = buildHolidaySet([], [new Date().getFullYear(), new Date().getFullYear() + 1]);

  function novoPrazo(p: Partial<Prazo> & Pick<Prazo, 'tipo' | 'processoId' | 'responsavel'>, offsetDiasCorridos: number, dias: number): Prazo {
    const dataBase = isoDaysFromNow(offsetDiasCorridos - dias);
    return {
      id: newId(),
      dataBase,
      dataVencimento: addBusinessDays(dataBase, dias, holidays),
      prazoDiasUteis: dias,
      status: 'pendente',
      createdAt: now,
      ...p,
    };
  }

  const prazos: Prazo[] = [
    novoPrazo({ tipo: 'Defesa PROCON', processoId: processos[0].id, responsavel: interno.id }, -3, 0),
    novoPrazo({ tipo: 'Contestação', processoId: processos[1].id, responsavel: viseu.id }, 0, 0),
    novoPrazo({ tipo: 'Manifestação', processoId: processos[2].id, responsavel: cgv.id }, 3, 3),
    novoPrazo({ tipo: 'Recurso Ordinário', processoId: processos[3].id, responsavel: jorge.id }, 12, 12),
    novoPrazo({ tipo: 'Réplica', processoId: processos[1].id, responsavel: viseu.id }, 25, 20),
    novoPrazo(
      { tipo: 'Alegações Finais', processoId: processos[4].id, responsavel: interno.id, status: 'cumprido', cumpridoEm: isoDaysFromNow(-10) },
      -10,
      10,
    ),
  ];

  const eventos: EventoAgenda[] = [
    {
      id: newId(),
      titulo: 'Audiência — Processo Cliente Exemplo 2',
      tipo: 'audiencia',
      data: isoDaysFromNow(12),
      hora: '14:00',
      processoId: processos[1].id,
      local: '3ª Vara Cível — TJSP',
    },
    {
      id: newId(),
      titulo: 'Reunião de acompanhamento — Viseu Advogados',
      tipo: 'reuniao',
      data: isoDaysFromNow(2),
      hora: '10:30',
    },
    {
      id: newId(),
      titulo: 'Call — Kakau (parceria)',
      tipo: 'reuniao',
      data: isoDaysFromNow(5),
      hora: '16:00',
    },
  ];

  const pagamentosEscritorio: import('./types').PagamentoEscritorio[] = [
    {
      id: newId(),
      escritorioId: viseu.id,
      processoId: processos[1].id,
      descricao: 'Honorários — contestação',
      tipo: 'honorarios',
      valor: 1800,
      vencimento: isoDaysFromNow(5),
      status: 'pendente',
      createdAt: now,
    },
    {
      id: newId(),
      escritorioId: cgv.id,
      processoId: processos[2].id,
      descricao: 'Honorários de êxito',
      tipo: 'exito',
      valor: 950,
      vencimento: isoDaysFromNow(-4),
      status: 'atrasado',
      createdAt: now,
    },
  ];

  const condenacoes: import('./types').CondenacaoJudicial[] = [
    {
      id: newId(),
      processoId: processos[4].id,
      descricao: 'Condenação — danos morais',
      valor: 3000,
      prazoPagamento: isoDaysFromNow(20),
      status: 'pendente',
      createdAt: now,
    },
  ];

  const parceriasCRM: import('./types').ParceriaCRM[] = [
    {
      id: newId(),
      parceiro: 'Kakau',
      seguradoraId: kakau.id,
      estagio: 'Ativo',
      responsavelInterno: 'Jurídico Interno',
      contatos: [{ id: newId(), at: now, resumo: 'Renovação de convênio institucional discutida.' }],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: newId(),
      parceiro: 'Mapfre',
      seguradoraId: mapfre.id,
      estagio: 'Em negociação',
      responsavelInterno: 'Jurídico Interno',
      contatos: [],
      createdAt: now,
      updatedAt: now,
    },
  ];

  const atas: import('./types').AtaReuniao[] = [
    {
      id: newId(),
      titulo: 'Alinhamento mensal — Viseu Advogados',
      data: isoDaysFromNow(-7),
      participantes: ['Nadjane Reis', 'Jurídico Interno'],
      pauta: 'Revisão de casos em aberto e prazos da semana.',
      decisoes: 'Priorizar contestações com prazo nos próximos 15 dias.',
      acoes: [
        { id: newId(), descricao: 'Enviar documentos pendentes do caso Cliente Exemplo 2', responsavel: 'Jurídico Interno', concluida: false },
      ],
      createdAt: now,
    },
  ];

  await repos.escritorios.replaceAll(escritorios);
  await repos.seguradoras.replaceAll(seguradoras);
  await repos.clientes.replaceAll(clientes);
  await repos.processos.replaceAll(processos);
  await repos.prazos.replaceAll(prazos);
  await repos.eventos.replaceAll(eventos);
  await repos.pagamentosEscritorio.replaceAll(pagamentosEscritorio);
  await repos.condenacoes.replaceAll(condenacoes);
  await repos.parceriasCRM.replaceAll(parceriasCRM);
  await repos.atas.replaceAll(atas);

  const config = await getConfig();
  await saveConfig({
    ...config,
    tiposPeca: DEFAULT_TIPOS_PECA.map((t) => ({ id: newId(), ...t })),
    feriadosCustom: config.feriadosCustom ?? [],
    retencaoLixeiraDias: 30,
  });

  window.localStorage.setItem(SEED_FLAG_KEY, '1');
}
