import { Repository } from './repository';
import type {
  AppConfig,
  Cliente,
  Escritorio,
  EventoAgenda,
  Intimacao,
  Prazo,
  Processo,
  Seguradora,
} from './types';
import { storage } from './storageAdapter';
import { seedIfEmpty } from './seed';

export const repos = {
  processos: new Repository<Processo>('processos'),
  clientes: new Repository<Cliente>('clientes'),
  prazos: new Repository<Prazo>('prazos'),
  eventos: new Repository<EventoAgenda>('eventos'),
  escritorios: new Repository<Escritorio>('escritorios'),
  seguradoras: new Repository<Seguradora>('seguradoras'),
  intimacoes: new Repository<Intimacao>('intimacoes'),
};

const CONFIG_KEY = 'config';

export async function getConfig(): Promise<AppConfig> {
  const rows = await storage.getAll<AppConfig>(CONFIG_KEY);
  return rows[0] ?? { tiposPeca: [], feriadosCustom: [], retencaoLixeiraDias: 30 };
}

export async function saveConfig(config: AppConfig): Promise<void> {
  await storage.saveAll(CONFIG_KEY, [config]);
}

let initialized: Promise<void> | null = null;

/** Ensures seed data exists exactly once per browser storage. Safe to call repeatedly. */
export function ensureSeeded(): Promise<void> {
  if (!initialized) {
    initialized = seedIfEmpty(repos, getConfig, saveConfig);
  }
  return initialized;
}
