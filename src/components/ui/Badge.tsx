import type { UrgencyBucket } from '../../data/types';
import { URGENCY_LABEL } from '../../lib/businessDays';

export function UrgencyBadge({ bucket }: { bucket: UrgencyBucket }) {
  return <span className={`badge badge-${bucket}`}>{URGENCY_LABEL[bucket]}</span>;
}

export function Badge({
  children,
  variant = 'neutral',
}: {
  children: React.ReactNode;
  variant?: 'neutral' | 'accent' | 'warn' | 'ok';
}) {
  const map: Record<string, string> = {
    neutral: 'badge-neutral',
    accent: 'badge-accent',
    warn: 'badge-vencido',
    ok: 'badge-cumprido',
  };
  return <span className={`badge ${map[variant]}`}>{children}</span>;
}
