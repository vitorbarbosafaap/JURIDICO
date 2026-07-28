import type { ReactNode } from 'react';

export function KpiCard({
  label,
  value,
  icon,
  warn,
  delta,
}: {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  warn?: boolean;
  delta?: string;
}) {
  return (
    <div className="kpi-card">
      <div className="label">
        {icon}
        {label}
      </div>
      <div className={`value ${warn ? 'warn' : ''}`}>{value}</div>
      {delta && <div className="delta">{delta}</div>}
    </div>
  );
}
