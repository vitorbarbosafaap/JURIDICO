import { toISODate } from '../../lib/businessDays';

export const DOW_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

/** 6-week grid starting on Sunday, always covering the full month. */
export function monthMatrix(anchor: Date): Date[] {
  const first = startOfMonth(anchor);
  const gridStart = new Date(first);
  gridStart.setDate(gridStart.getDate() - first.getDay());
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    return d;
  });
}

export function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() - copy.getDay());
  return copy;
}

export function weekDays(anchor: Date): Date[] {
  const start = startOfWeek(anchor);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export function monthLabel(d: Date): string {
  return d.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
}

export function weekLabel(anchor: Date): string {
  const days = weekDays(anchor);
  const first = days[0];
  const last = days[6];
  return `${first.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} – ${last.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`;
}

export function dayLabel(d: Date): string {
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' });
}

export function sameDay(a: Date, b: Date): boolean {
  return toISODate(a) === toISODate(b);
}
