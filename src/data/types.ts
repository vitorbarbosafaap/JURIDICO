// Domain model for the Jurídico Pitzi system.
// Kept intentionally storage-agnostic — repositories decide how these are persisted.

export type ID = string;

export interface SoftDeletable {
  deletedAt?: string | null;
}

export interface AuditEntry {
  id: ID;
  at: string;
  autor: string;
  acao: string;
  detalhe?: string;
}

export type TipoDemanda = 'Judicial' | 'JEC' | 'PROCON' | 'Sinistro';
export type Contingencia = 'Provável' | 'Possível' | 'Remota';
export type StatusProcesso =
  | 'Novo'
  | 'Aguardando subsídio'
  | 'Em defesa'
  | 'Aguardando audiência'
  | 'Concluído';
export type CanalVenda = 'Amazon' | 'Gazin' | 'PagBank' | 'Direto' | 'Outro';

export interface ContatoEscritorio {
  id: ID;
  nome: string;
  cargo?: string;
  email?: string;
  telefone?: string;
}

export interface Escritorio extends SoftDeletable {
  id: ID;
  nome: string;
  tipo: 'interno' | 'externo';
  contatos: ContatoEscritorio[];
  observacoes?: string;
}

export interface Seguradora extends SoftDeletable {
  id: ID;
  nome: string;
  cnpj?: string;
  susep?: string;
  observacoes?: string;
}

export interface Cliente extends SoftDeletable {
  id: ID;
  nome: string;
  cpf?: string;
  telefone?: string;
  email?: string;
  canalAquisicao?: CanalVenda;
  historicoSinistros?: string;
  createdAt: string;
}

export interface ComunicacaoEntry {
  id: ID;
  at: string;
  canal: 'email' | 'telefone' | 'reuniao' | 'sistema';
  resumo: string;
}

export interface DocumentoRef {
  id: ID;
  titulo: string;
  url: string;
  tipo?: string;
  adicionadoEm: string;
}

export interface LancamentoFinanceiro {
  id: ID;
  descricao: string;
  valor: number;
  vencimento: string;
  status: 'pendente' | 'aprovado' | 'pago' | 'atrasado';
}

export interface Processo extends SoftDeletable {
  id: ID;
  numeroCNJ?: string;
  tribunalVara?: string;
  tipoDemanda: TipoDemanda;
  clienteId?: ID;
  contingencia: Contingencia;
  valorCausa?: number;
  escritorioResponsavelId?: ID;
  status: StatusProcesso;
  canalVenda?: CanalVenda;
  produto?: string;
  seguradoraId?: ID;
  createdAt: string;
  updatedAt: string;
  timeline: { id: ID; at: string; texto: string }[];
  documentos: DocumentoRef[];
  comunicacoes: ComunicacaoEntry[];
  financeiro: LancamentoFinanceiro[];
  auditoria: AuditEntry[];
  adesaoProConsumidor?: StatusProConsumidor;
  checklistProcon?: ChecklistProconItem[];
}

export type ResponsavelPrazo = 'interno' | ID; // ID references an Escritorio

export interface Prazo extends SoftDeletable {
  id: ID;
  processoId?: ID;
  tipo: string;
  prazoDiasUteis: number;
  dataBase: string; // ISO date, when the clock started
  dataVencimento: string; // ISO date, computed
  responsavel: ResponsavelPrazo;
  status: 'pendente' | 'cumprido';
  cumpridoEm?: string;
  observacoes?: string;
  createdAt: string;
}

export type TipoEvento = 'audiencia' | 'reuniao' | 'prazo' | 'outro';

export interface EventoAgenda extends SoftDeletable {
  id: ID;
  titulo: string;
  tipo: TipoEvento;
  data: string; // ISO date
  hora?: string; // HH:mm
  local?: string;
  processoId?: ID;
  prazoId?: ID;
  observacoes?: string;
}

export interface Intimacao extends SoftDeletable {
  id: ID;
  tipoAcao: string;
  tribunalVara?: string;
  recebidoEm: string;
  processoId?: ID;
  resumo?: string;
  prazoSugeridoId?: ID;
}

export interface TipoPecaConfig {
  id: ID;
  tipo: string;
  diasUteis: number;
}

export interface FeriadoForense {
  id: ID;
  data: string; // ISO date
  descricao: string;
  uf?: string;
}

export interface AppConfig {
  tiposPeca: TipoPecaConfig[];
  feriadosCustom: FeriadoForense[];
  retencaoLixeiraDias: number;
  checklistProconGlobal?: ChecklistProconItem[];
}

export type UrgencyBucket =
  | 'vencido'
  | 'hoje'
  | 'semana'
  | 'quinzena'
  | 'sem-urgencia'
  | 'cumprido';

// ---------------------------------------------------------------------------
// Fase 2 — Automação documental
// ---------------------------------------------------------------------------

export type StatusAprovacao = 'rascunho' | 'revisao' | 'aprovado' | 'enviado';
export type Genero = 'masculino' | 'feminino';

export interface CartaRecusa extends SoftDeletable {
  id: ID;
  processoId?: ID;
  seguradoraId?: ID;
  genero: Genero;
  categoriaHipoteseId: string;
  vars: Record<string, string>;
  status: StatusAprovacao;
  createdAt: string;
  updatedAt: string;
  historico: { id: ID; at: string; de: StatusAprovacao | null; para: StatusAprovacao; autor: string }[];
}

export interface SubsidioGerado extends SoftDeletable {
  id: ID;
  processoId?: ID;
  tipo: 'procon' | 'judicial';
  motivoId: string;
  ramoId: string;
  vars: Record<string, string>;
  createdAt: string;
}

export interface AtaAcao {
  id: ID;
  descricao: string;
  responsavel: string;
  prazo?: string; // ISO date
  prazoId?: ID; // linked Prazo if converted
  concluida: boolean;
}

export interface AtaReuniao extends SoftDeletable {
  id: ID;
  titulo: string;
  data: string; // ISO date
  participantes: string[];
  pauta: string;
  decisoes: string;
  acoes: AtaAcao[];
  processoId?: ID;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Fase 3 — Financeiro e CRM
// ---------------------------------------------------------------------------

export type StatusPagamento = 'pendente' | 'aprovado' | 'pago' | 'atrasado';

export interface PagamentoEscritorio extends SoftDeletable {
  id: ID;
  escritorioId: ID;
  processoId?: ID;
  descricao: string;
  tipo: 'honorarios' | 'exito' | 'reembolso' | 'outro';
  valor: number;
  notaFiscal?: string;
  vencimento: string;
  status: StatusPagamento;
  pagoEm?: string;
  createdAt: string;
}

export interface CondenacaoJudicial extends SoftDeletable {
  id: ID;
  processoId: ID;
  descricao: string;
  valor: number;
  prazoPagamento: string; // ISO date
  status: StatusPagamento;
  comprovanteUrl?: string;
  createdAt: string;
}

export type EstagioParceria =
  | 'Prospecção'
  | 'Em negociação'
  | 'Ativo'
  | 'Em revisão'
  | 'Encerrado';

export interface ContatoParceria {
  id: ID;
  at: string;
  resumo: string;
}

export interface ParceriaCRM extends SoftDeletable {
  id: ID;
  parceiro: string;
  seguradoraId?: ID;
  estagio: EstagioParceria;
  responsavelInterno?: string;
  observacoes?: string;
  contatos: ContatoParceria[];
  createdAt: string;
  updatedAt: string;
}

// ---------------------------------------------------------------------------
// Fase 4 — Integração de dados
// ---------------------------------------------------------------------------

export type StorageBackendKind = 'local' | 'google-sheets' | 'firebase';

export interface GoogleSheetsBackendConfig {
  webAppUrl: string;
  apiKey?: string;
}

export interface FirebaseBackendConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
}

export interface BackendSettings {
  active: StorageBackendKind;
  googleSheets?: GoogleSheetsBackendConfig;
  firebase?: FirebaseBackendConfig;
}

// ---------------------------------------------------------------------------
// Fase 5 — Compliance e auditoria avançada
// ---------------------------------------------------------------------------

export type StatusProConsumidor = 'nao_aderido' | 'aderido' | 'nao_aplicavel';

export interface ChecklistProconItem {
  id: ID;
  item: string;
  atendido: boolean;
}

export interface GlobalAuditEntry {
  id: ID;
  at: string;
  colecao: string;
  entidadeId: string;
  entidadeLabel: string;
  acao: 'criação' | 'atualização' | 'exclusão' | 'restauração';
  autor: string;
  detalhe?: string;
}
