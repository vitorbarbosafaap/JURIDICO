import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { repos } from '../../data/db';
import { useCollection } from '../../hooks/useCollection';
import { toISODate, todayISO } from '../../lib/businessDays';
import { DOW_LABELS, dayLabel, monthLabel, monthMatrix, sameDay, weekDays, weekLabel } from './calendarUtils';
import { EventoFormModal } from './EventoFormModal';

type ViewMode = 'mes' | 'semana' | 'dia';

interface CalendarEntry {
  id: string;
  titulo: string;
  tipo: 'audiencia' | 'reuniao' | 'outro' | 'prazo';
  data: string;
  hora?: string;
  local?: string;
}

export function Agenda() {
  const { items: eventos, reload } = useCollection(repos.eventos);
  const { items: prazos } = useCollection(repos.prazos);
  const { items: processos } = useCollection(repos.processos);

  const [view, setView] = useState<ViewMode>('mes');
  const [anchor, setAnchor] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState<string | undefined>(undefined);

  const entries: CalendarEntry[] = useMemo(() => {
    const manuais: CalendarEntry[] = eventos
      .filter((e) => !(e.tipo === 'prazo' && e.prazoId))
      .map((e) => ({ id: e.id, titulo: e.titulo, tipo: e.tipo, data: e.data, hora: e.hora, local: e.local }));

    const prazosVirtuais: CalendarEntry[] = prazos
      .filter((p) => p.status === 'pendente')
      .map((p) => ({ id: `prazo-${p.id}`, titulo: `Prazo: ${p.tipo}`, tipo: 'prazo' as const, data: p.dataVencimento }));

    return [...manuais, ...prazosVirtuais];
  }, [eventos, prazos]);

  function entriesOn(d: Date): CalendarEntry[] {
    return entries
      .filter((e) => e.data === toISODate(d))
      .sort((a, b) => (a.hora ?? '99:99').localeCompare(b.hora ?? '99:99'));
  }

  function navigate(delta: number) {
    const next = new Date(anchor);
    if (view === 'mes') next.setMonth(next.getMonth() + delta);
    else if (view === 'semana') next.setDate(next.getDate() + delta * 7);
    else next.setDate(next.getDate() + delta);
    setAnchor(next);
  }

  const title =
    view === 'mes' ? monthLabel(anchor) : view === 'semana' ? weekLabel(anchor) : dayLabel(anchor);

  function openNewEvento(date?: Date) {
    setModalDate(date ? toISODate(date) : undefined);
    setShowModal(true);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <h2>Agenda</h2>
          <p className="desc">Audiências, reuniões e prazos em um só lugar.</p>
        </div>
        <button className="btn btn-primary" onClick={() => openNewEvento(view === 'dia' ? anchor : undefined)}>
          <Plus size={15} /> Novo evento
        </button>
      </div>

      <div className="calendar-toolbar">
        <button className="icon-btn" onClick={() => navigate(-1)}>
          <ChevronLeft size={18} />
        </button>
        <div className="title" style={{ textTransform: 'capitalize' }}>
          {title}
        </div>
        <button className="icon-btn" onClick={() => navigate(1)}>
          <ChevronRight size={18} />
        </button>
        <button className="btn btn-ghost btn-sm" onClick={() => setAnchor(new Date())}>
          Hoje
        </button>
        <div className="spacer" />
        <div className="calendar-view-toggle">
          <button className={view === 'mes' ? 'active' : ''} onClick={() => setView('mes')}>
            Mês
          </button>
          <button className={view === 'semana' ? 'active' : ''} onClick={() => setView('semana')}>
            Semana
          </button>
          <button className={view === 'dia' ? 'active' : ''} onClick={() => setView('dia')}>
            Dia
          </button>
        </div>
      </div>

      {view === 'mes' && (
        <div className="calendar-grid">
          {DOW_LABELS.map((d) => (
            <div className="calendar-dow" key={d}>
              {d}
            </div>
          ))}
          {monthMatrix(anchor).map((d) => {
            const outside = d.getMonth() !== anchor.getMonth();
            const isToday = toISODate(d) === todayISO();
            const dayEntries = entriesOn(d);
            return (
              <div
                key={d.toISOString()}
                className={`calendar-day ${outside ? 'outside' : ''} ${isToday ? 'today' : ''}`}
                onClick={() => openNewEvento(d)}
              >
                <div className="num">{d.getDate()}</div>
                {dayEntries.slice(0, 3).map((e) => (
                  <div className={`calendar-event tipo-${e.tipo}`} key={e.id} title={e.titulo}>
                    {e.titulo}
                  </div>
                ))}
                {dayEntries.length > 3 && (
                  <div className="text-muted" style={{ fontSize: 10 }}>
                    +{dayEntries.length - 3} mais
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {view === 'semana' && (
        <div className="calendar-grid">
          {weekDays(anchor).map((d) => (
            <div className="calendar-dow" key={d.toISOString()}>
              {DOW_LABELS[d.getDay()]} {d.getDate()}
            </div>
          ))}
          {weekDays(anchor).map((d) => {
            const isToday = toISODate(d) === todayISO();
            const dayEntries = entriesOn(d);
            return (
              <div
                key={d.toISOString()}
                className={`calendar-day ${isToday ? 'today' : ''}`}
                style={{ minHeight: 220 }}
                onClick={() => openNewEvento(d)}
              >
                <div className="num">{d.getDate()}</div>
                {dayEntries.map((e) => (
                  <div className={`calendar-event tipo-${e.tipo}`} key={e.id} title={e.titulo}>
                    {e.hora ? `${e.hora} ` : ''}
                    {e.titulo}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      )}

      {view === 'dia' && (
        <div className="day-list">
          {entriesOn(anchor).length === 0 && <p className="text-muted text-sm">Nenhum compromisso neste dia.</p>}
          {entriesOn(anchor).map((e) => (
            <div className="day-list-item" key={e.id}>
              <div className="time">{e.hora ?? '—'}</div>
              <div>
                <div style={{ fontWeight: 700 }}>{e.titulo}</div>
                {e.local && <div className="text-muted text-sm">{e.local}</div>}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <EventoFormModal
          processos={processos}
          defaultDate={modalDate}
          onClose={() => setShowModal(false)}
          onSaved={() => {
            setShowModal(false);
            reload();
          }}
        />
      )}
    </div>
  );
}
