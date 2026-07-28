import type { ReactNode } from 'react';

export function EmptyState({
  icon = '📁',
  title,
  description,
  action,
}: {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <div className="icon">{icon}</div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}
