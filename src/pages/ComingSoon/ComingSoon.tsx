import { useLocation } from 'react-router-dom';
import { ALL_ITEMS } from '../../nav';
import { EmptyState } from '../../components/ui/EmptyState';

const ROADMAP_NOTE: Record<string, string> = {
  '/guia': 'Guia de uso passo a passo do sistema — publicado após a consolidação das Fases 1-5.',
};

export function ComingSoon() {
  const { pathname } = useLocation();
  const item = ALL_ITEMS.find((i) => i.path === pathname);

  return (
    <EmptyState
      icon="🚧"
      title={`${item?.label ?? 'Módulo'} — em construção`}
      description={
        ROADMAP_NOTE[pathname] ??
        'Este módulo está previsto nas próximas fases do roadmap do Jurídico Pitzi.'
      }
    />
  );
}
