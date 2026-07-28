import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { repos } from '../../data/db';
import { useConfig } from '../../hooks/useConfig';
import { buildHolidaySet, classifyUrgency } from '../../lib/businessDays';

export function DeadlineBanner() {
  const navigate = useNavigate();
  const { config } = useConfig();
  const [countHoje, setCountHoje] = useState(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const prazos = await repos.prazos.list();
      const holidays = buildHolidaySet(config?.feriadosCustom ?? [], [
        new Date().getFullYear(),
        new Date().getFullYear() + 1,
      ]);
      const hoje = prazos.filter(
        (p) => p.status === 'pendente' && classifyUrgency(p.dataVencimento, p.status) === 'hoje',
      );
      void holidays;
      if (!cancelled) setCountHoje(hoje.length);
    }
    load();
    const unsub = repos.prazos.subscribe(load);
    return () => {
      cancelled = true;
      unsub();
    };
  }, [config]);

  if (countHoje === 0) return null;

  return (
    <div className="alert-banner">
      <span>⚠️</span>
      <span>
        {countHoje} prazo{countHoje > 1 ? 's' : ''} vence{countHoje > 1 ? 'm' : ''} HOJE!
      </span>
      <button className="link" onClick={() => navigate('/prazos')}>
        Acessar Kanban de Prazos
      </button>
    </div>
  );
}
