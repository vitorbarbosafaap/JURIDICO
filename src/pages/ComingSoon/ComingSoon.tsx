import { useLocation } from 'react-router-dom';
import { ALL_ITEMS } from '../../nav';
import { EmptyState } from '../../components/ui/EmptyState';

const ROADMAP_NOTE: Record<string, string> = {
  '/financeiro': 'Fase 3 — controle de pagamentos a escritórios, condenações e exposição financeira.',
  '/crm': 'Fase 3 — pipeline de relacionamento institucional com seguradoras e parceiros.',
  '/intimacoes': 'Fase 2 — inbox de intimações com sugestão automática de prazos por tipo de peça.',
  '/gerador-subsidios': 'Fase 2 — geração automatizada de subsídios/defesas com exportação em .docx.',
  '/gerador-cartas': 'Fase 2 — cartas de recusa e notificação de sinistro (Lei 15.040/2024) com exportação .docx.',
  '/ata': 'Fase 3 — atas de reunião com geração automática de ações e prazos.',
  '/guia': 'Guia de uso passo a passo do sistema, publicado após consolidação da Fase 1.',
};

export function ComingSoon() {
  const { pathname } = useLocation();
  const item = ALL_ITEMS.find((i) => i.path === pathname);

  const legacyLink =
    pathname === '/gerador-subsidios' ? (
      <a className="btn btn-primary" href="./legado/gerador-subsidios.html" target="_blank" rel="noreferrer">
        Abrir ferramenta atual (versão avulsa)
      </a>
    ) : undefined;

  return (
    <EmptyState
      icon="🚧"
      title={`${item?.label ?? 'Módulo'} — em construção`}
      description={
        ROADMAP_NOTE[pathname] ??
        'Este módulo está previsto nas próximas fases do roadmap do Jurídico Pitzi.'
      }
      action={legacyLink}
    />
  );
}
