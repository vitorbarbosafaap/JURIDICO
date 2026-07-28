import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  CalendarDays,
  AlarmClock,
  Briefcase,
  Users,
  Wallet,
  Handshake,
  Inbox,
  FileText,
  MailWarning,
  ClipboardList,
  Settings,
  Trash2,
  BookOpen,
} from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  /** Fase 1 items are fully implemented; others render a roadmap placeholder. */
  implemented: boolean;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

export const NAV: NavGroup[] = [
  {
    title: 'Principal',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard, implemented: true },
      { label: 'Agenda', path: '/agenda', icon: CalendarDays, implemented: true },
      { label: 'Prazos', path: '/prazos', icon: AlarmClock, implemented: true },
    ],
  },
  {
    title: 'Cadastros',
    items: [
      { label: 'Processos', path: '/processos', icon: Briefcase, implemented: true },
      { label: 'Clientes', path: '/clientes', icon: Users, implemented: true },
      { label: 'Financeiro', path: '/financeiro', icon: Wallet, implemented: false },
      { label: 'CRM (Captação)', path: '/crm', icon: Handshake, implemented: false },
    ],
  },
  {
    title: 'Ferramentas',
    items: [
      { label: 'Intimações', path: '/intimacoes', icon: Inbox, implemented: false },
      { label: 'Gerador de Subsídios', path: '/gerador-subsidios', icon: FileText, implemented: false },
      { label: 'Cartas de Recusa/Notificação', path: '/gerador-cartas', icon: MailWarning, implemented: false },
      { label: 'ATA/Reunião', path: '/ata', icon: ClipboardList, implemented: false },
    ],
  },
  {
    title: 'Gestão',
    items: [
      { label: 'Configurações', path: '/configuracoes', icon: Settings, implemented: true },
      { label: 'Exclusões', path: '/exclusoes', icon: Trash2, implemented: true },
      { label: 'Guia (Passo a Passo)', path: '/guia', icon: BookOpen, implemented: false },
    ],
  },
];

export const ALL_ITEMS: NavItem[] = NAV.flatMap((g) => g.items);
