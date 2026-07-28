import type { FeriadoForense, UrgencyBucket } from '../data/types';

// ---- date helpers (plain ISO "yyyy-mm-dd" strings, no timezone drift) ----

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function fromISODate(iso: string): Date {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m ?? 1) - 1, d ?? 1);
}

export function todayISO(): string {
  return toISODate(new Date());
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

// Gauss algorithm for the date of Easter Sunday, used to derive the
// movable Brazilian forensic holidays (Carnaval, Sexta-feira Santa, Corpus Christi).
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

export function nationalHolidays(year: number): FeriadoForense[] {
  const easter = easterSunday(year);
  const carnaval = addDays(easter, -47); // terça-feira de carnaval
  const sextaSanta = addDays(easter, -2);
  const corpusChristi = addDays(easter, 60);

  const fixed: [string, string][] = [
    [`${year}-01-01`, 'Confraternização Universal'],
    [`${year}-04-21`, 'Tiradentes'],
    [`${year}-05-01`, 'Dia do Trabalho'],
    [`${year}-09-07`, 'Independência do Brasil'],
    [`${year}-10-12`, 'Nossa Senhora Aparecida'],
    [`${year}-11-02`, 'Finados'],
    [`${year}-11-15`, 'Proclamação da República'],
    [`${year}-11-20`, 'Consciência Negra'],
    [`${year}-12-25`, 'Natal'],
  ];

  const movable: [string, string][] = [
    [toISODate(carnaval), 'Carnaval'],
    [toISODate(sextaSanta), 'Sexta-feira Santa'],
    [toISODate(corpusChristi), 'Corpus Christi'],
  ];

  return [...fixed, ...movable].map(([data, descricao]) => ({
    id: `nat-${data}`,
    data,
    descricao,
  }));
}

export function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6;
}

export function buildHolidaySet(customHolidays: FeriadoForense[], years: number[]): Set<string> {
  const set = new Set<string>();
  years.forEach((y) => nationalHolidays(y).forEach((h) => set.add(h.data)));
  customHolidays.forEach((h) => set.add(h.data));
  return set;
}

/** Adds N business days (excluding weekends and holidays) to a base ISO date. */
export function addBusinessDays(baseISO: string, days: number, holidays: Set<string>): string {
  let d = fromISODate(baseISO);
  let remaining = days;
  while (remaining > 0) {
    d = addDays(d, 1);
    if (isWeekend(d) || holidays.has(toISODate(d))) continue;
    remaining -= 1;
  }
  return toISODate(d);
}

/** Business days between two ISO dates (positive if `toISO` is after `fromISO`). */
export function businessDaysBetween(fromISO: string, toISO: string, holidays: Set<string>): number {
  const from = fromISODate(fromISO);
  const to = fromISODate(toISO);
  const sign = to.getTime() >= from.getTime() ? 1 : -1;
  let count = 0;
  let d = from;
  while (toISODate(d) !== toISO) {
    d = addDays(d, sign);
    if (isWeekend(d) || holidays.has(toISODate(d))) continue;
    count += sign;
  }
  return count;
}

export function classifyUrgency(dataVencimentoISO: string, status: 'pendente' | 'cumprido'): UrgencyBucket {
  if (status === 'cumprido') return 'cumprido';
  const today = todayISO();
  const diffDays = Math.round(
    (fromISODate(dataVencimentoISO).getTime() - fromISODate(today).getTime()) / 86_400_000,
  );
  if (diffDays < 0) return 'vencido';
  if (diffDays === 0) return 'hoje';
  if (diffDays <= 7) return 'semana';
  if (diffDays <= 15) return 'quinzena';
  return 'sem-urgencia';
}

export const URGENCY_LABEL: Record<UrgencyBucket, string> = {
  vencido: 'Vencido',
  hoje: 'Hoje',
  semana: 'Esta Semana',
  quinzena: 'Próximos 15 dias',
  'sem-urgencia': 'Sem urgência',
  cumprido: 'Cumprido',
};

export function formatDateBR(iso?: string): string {
  if (!iso) return '—';
  const d = fromISODate(iso);
  return d.toLocaleDateString('pt-BR');
}
