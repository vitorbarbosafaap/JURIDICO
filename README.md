# Jurídico Pitzi — Legal Ops

Sistema jurídico interno da Pitzi Reparação e Manutenção de Equipamentos Eletrônicos
Ltda. (Leapfone), para gestão do portfólio de processos (PROCON, ações judiciais,
sinistros de seguro), prazos, agenda e relacionamento com escritórios parceiros
(Viseu Advogados, CGV Advogados, Jorge Masanobu Baffi Onishi) e seguradoras
(Kakau, Generali Brasil, Gazin Seguros, Mapfre).

Roda **100% estático no GitHub Pages** — sem backend próprio. Todas as fases do
roadmap original (1 a 5) estão implementadas.

## Stack

- React + TypeScript + Vite, build estático (`dist/`).
- Roteamento client-side via hash (`HashRouter`) — funciona em qualquer path do
  GitHub Pages sem configuração de rewrites no servidor.
- Ícones [lucide-react](https://lucide.dev) (estilo outline, consistente em toda a
  aplicação).
- Design system Pitzi aplicado em `src/styles/global.css` (tokens de cor, tipografia
  Inter/Source Serif 4, componentes de card/badge/kanban/calendário/tabela/modal/
  gerador de documentos).
- Exportação de documentos em `.docx` via [`docx`](https://www.npmjs.com/package/docx)
  + `file-saver` (ver `src/lib/docBlocks.ts` e `src/lib/docxExport.ts`).

## Rodando localmente

```bash
npm install
npm run dev       # servidor de desenvolvimento
npm run build     # build de produção em dist/
npm run typecheck
```

## Persistência de dados

Por padrão os dados ficam **neste navegador**, via `localStorage` — funciona
offline, mas não sincroniza entre dispositivos. A camada de dados é isolada em
`src/data/`:

- `types.ts` — modelo de domínio completo (Processo, Cliente, Prazo, Evento,
  Escritório, Seguradora, Intimação, Carta de Recusa, Subsídio, Ata, Pagamento,
  Condenação, Parceria CRM, Config, Auditoria).
- `storageAdapter.ts` — interface `StorageAdapter` (`getAll`/`saveAll`) por trás de
  um dispatcher (`setActiveAdapter`/`getActiveAdapter`) que permite trocar o backend
  **em tempo de execução**, sem que nenhum repositório ou componente saiba disso.
- `repository.ts` — `Repository<T>` genérico com CRUD + soft delete + log
  automático de auditoria (ver `globalAudit.ts`) sobre qualquer `StorageAdapter`.
- `adapters/googleSheetsAdapter.ts` e `adapters/firebaseAdapter.ts` — as duas
  integrações reais da Fase 4 (veja abaixo).
- `bootstrapBackend.ts` — lê a escolha persistida (`backendSettings.ts`) e ativa o
  adapter correspondente no boot da aplicação.
- `db.ts` / `seed.ts` — instâncias das coleções e dados de exemplo (seed) carregados
  na primeira execução.

### Trocando o backend (Configurações → Integração de Dados)

- **Local (padrão)** — `localStorage`, sem configuração.
- **Google Sheets** — reaproveita a planilha mestre já existente. Faça o deploy do
  Apps Script em [`docs/apps-script/Code.gs`](docs/apps-script/Code.gs) (instruções
  completas no topo do arquivo) e informe a URL do Web App + uma chave de API.
- **Firebase (Firestore + Google OAuth)** — sincronização em tempo real entre
  dispositivos com login Google. O SDK do Firebase é carregado sob demanda (dynamic
  `import()`), então escolher Local ou Google Sheets não baixa esse código.

Trocar o backend recarrega a aplicação. Um botão "Testar conexão" valida a
configuração antes de você migrar de fato.

### Autenticação

- **Padrão (Local/Google Sheets)**: senha local opcional, configurada em
  Configurações → Segurança. O hash (SHA-256, via Web Crypto) fica só neste
  navegador; sem senha configurada, o sistema abre livremente — adequado para uso
  pessoal/interno.
- **Firebase**: login com Google substitui a senha local enquanto esse backend
  estiver ativo.

## Publicando no GitHub Pages

1. Faça merge deste branch em `main`.
2. Em **Settings → Pages**, defina a fonte (“Source”) como **GitHub Actions**.
3. O workflow `.github/workflows/deploy.yml` builda e publica automaticamente a
   cada push em `main`.

## Ferramenta legada preservada

O gerador de subsídios avulso original está preservado, sem alterações, em
`public/legado/gerador-subsidios.html`. O novo módulo **Gerador de Subsídios**
reimplementa o mesmo catálogo jurídico (extraído literalmente do arquivo original,
para preservar fielmente a argumentação já validada) com uma UI integrada ao
sistema e exportação em `.docx`.

## Módulos por fase

- **Fase 1 — MVP local**: Dashboard, Agenda, Prazos (Kanban + lista), Processos,
  Clientes, Configurações (escritórios, seguradoras, tipos de peça, feriados
  forenses) e Exclusões (lixeira com restauração).
- **Fase 2 — Automação documental**: Intimações (inbox + sugestão automática de
  prazo por tipo de peça, com atalhos "+ Prazo" e "+ Prazo + Agenda"), Gerador de
  Subsídios (18 motivos/hipóteses, PROCON ou judicial) e Gerador de Cartas de
  Recusa/Notificação de Sinistro (Lei nº 15.040/2024, com concordância de gênero e
  fluxo de aprovação rascunho → revisão → aprovado → enviado) — ambos com preview
  serifado e exportação `.docx`. ATA/Reunião com geração de prazos a partir das
  ações.
- **Fase 3 — Financeiro e CRM**: pagamentos a escritórios externos, condenações
  judiciais, alertas de atraso e relatório de exposição financeira; pipeline Kanban
  de relacionamento institucional com seguradoras/parceiros.
- **Fase 4 — Integração de dados real**: adapters para Google Sheets e Firebase
  (ver acima), seletor de backend e autenticação.
- **Fase 5 — Compliance e auditoria avançada**: painel comparativo Lei
  15.040/2024 vs. regime anterior, checklist de conformidade PROCON/Senacon
  (institucional + status de adesão ao ProConsumidor por processo), trilha de
  auditoria global (toda criação/alteração/exclusão/restauração em qualquer
  coleção) e painel de alertas inteligentes no Dashboard (processos sem prazo,
  sem movimentação, escritórios com desempenho ruim, pagamentos em atraso).

O único item do menu ainda não implementado é o **Guia (Passo a Passo)** —
documentação de uso a ser publicada após a consolidação do sistema em produção.
