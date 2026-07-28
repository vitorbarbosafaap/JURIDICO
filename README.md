# Jurídico Pitzi — Legal Ops

Sistema jurídico interno da Pitzi Reparação e Manutenção de Equipamentos Eletrônicos
Ltda. (Leapfone), para gestão do portfólio de processos (PROCON, ações judiciais,
sinistros de seguro), prazos, agenda e relacionamento com escritórios parceiros
(Viseu Advogados, CGV Advogados, Jorge Masanobu Baffi Onishi) e seguradoras
(Kakau, Generali Brasil, Gazin Seguros, Mapfre).

Roda **100% estático no GitHub Pages** — sem backend próprio.

## Stack

- React + TypeScript + Vite, build estático (`dist/`).
- Roteamento client-side via hash (`HashRouter`) — funciona em qualquer path do
  GitHub Pages sem configuração de rewrites no servidor.
- Ícones [lucide-react](https://lucide.dev) (estilo outline, consistente em toda a
  aplicação).
- Design system Pitzi aplicado em `src/styles/global.css` (tokens de cor, tipografia
  Inter/Source Serif 4, componentes de card/badge/kanban/calendário/tabela/modal).

## Rodando localmente

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção em dist/
npm run typecheck
```

## Persistência de dados

Os dados ficam **neste navegador**, via `localStorage` — funciona offline, mas não
sincroniza entre dispositivos. Isso é intencional para a Fase 1 (MVP).

A camada de dados é isolada em `src/data/`:

- `types.ts` — modelo de domínio (Processo, Cliente, Prazo, Evento, Escritório,
  Seguradora, Config).
- `storageAdapter.ts` — interface `StorageAdapter` (`getAll`/`saveAll`). A
  implementação ativa é `LocalStorageAdapter`. Para trocar de backend (Google
  Sheets via Apps Script Web App, ou Firebase/Firestore — Fase 4), basta implementar
  a mesma interface e trocar a instância exportada em `storage`; nenhum componente
  ou repositório precisa mudar.
- `repository.ts` — `Repository<T>` genérico com CRUD + soft delete (usado pela
  lixeira em Exclusões) sobre qualquer `StorageAdapter`.
- `db.ts` / `seed.ts` — instâncias das coleções e dados de exemplo (seed) carregados
  na primeira execução.

**Aviso ao usuário**: como o armazenamento é local, limpar os dados do navegador
(ou usar outro dispositivo/navegador) reinicia a base. Faça backup exportando os
dados quando a Fase 4 (Google Sheets/Firebase) estiver disponível.

## Publicando no GitHub Pages

1. Faça merge deste branch em `main`.
2. Em **Settings → Pages**, defina a fonte (“Source”) como **GitHub Actions**.
3. O workflow `.github/workflows/deploy.yml` builda e publica automaticamente a
   cada push em `main`.

## Ferramenta existente preservada

O gerador de subsídios avulso que já estava neste repositório foi preservado em
`public/legado/gerador-subsidios.html` e continua acessível após o build (link
disponível na tela "Gerador de Subsídios" do novo sistema, que hoje é um
placeholder da Fase 2). Nenhuma lógica dele foi alterada.

## Fases do roadmap

- **Fase 1 (implementada)** — Dashboard, Agenda, Prazos (Kanban + lista),
  Processos, Clientes, Configurações (escritórios, seguradoras, tipos de peça,
  feriados forenses) e Exclusões (lixeira com restauração), com persistência em
  `localStorage`.
- **Fase 2** — Intimações (inbox + sugestão automática de prazo), Gerador de
  Subsídios e Gerador de Cartas de Recusa/Notificação de Sinistro (Lei
  15.040/2024), com exportação em `.docx`.
- **Fase 3** — Financeiro (pagamentos a escritórios, condenações, exposição
  financeira) e CRM de captação/relacionamento institucional.
- **Fase 4** — Integração de dados real: Google Sheets (Apps Script Web App) ou
  Firebase/Firestore como camada de persistência sincronizada, substituindo o
  `localStorage`.
- **Fase 5** — Painel comparativo Lei 15.040/2024 vs. regime anterior, checklist
  PROCON/Senacon/ProConsumidor, auditoria avançada e alertas inteligentes.

Os itens de menu ainda não implementados aparecem na barra lateral marcados como
"Em breve" e abrem uma tela de roadmap ao serem clicados — a navegação completa do
sistema final já está presente desde a Fase 1.
