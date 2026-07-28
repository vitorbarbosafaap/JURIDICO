import type { Genero, Seguradora } from '../../data/types';
import { D, esc, findHipotese, G, tratamentoFormal, V, todayLong, type CartaVars } from '../../data/cartasRecusaCatalogo';
import { hydrateExhibitSlots } from '../../lib/docBlocks';

export function buildCartaHTML(
  categoriaId: string,
  hipoteseId: string,
  vars: CartaVars,
  genero: Genero,
  seguradora: Seguradora | undefined,
): string {
  const hipotese = findHipotese(categoriaId, hipoteseId);
  if (!hipotese) return '';

  let html = `<h1 class="doctitle">São Paulo, ${todayLong()}</h1>`;
  html += `<div class="addr-block"><div class="to">Ao(À) ${tratamentoFormal(genero)}<br>${V(vars.nome, 'nome do segurado')}${vars.cpf ? `<br>CPF: ${esc(vars.cpf)}` : ''}</div></div>`;
  html += `<p class="doc-meta">Apólice/Bilhete nº: ${V(vars.apolice, 'nº da apólice/bilhete')} · Sinistro nº: ${V(vars.sinistro, 'nº do sinistro')}</p>`;

  html += `<h2 class="sec">Assunto</h2>`;
  html += `<p>Carta de Resposta à Regulação de Sinistro e Notificação de Resolução do Contrato de Proteção, nos termos da Lei nº 15.040/2024 (Marco Legal dos Seguros).</p>`;

  html += `<h2 class="sec">Da seguradora</h2>`;
  html += `<div class="kv"><b>Seguradora:</b><span>${V(seguradora?.nome, 'nome da seguradora')}</span></div>`;
  html += `<div class="kv"><b>CNPJ:</b><span>${V(seguradora?.cnpj, 'a confirmar em Configurações')}</span></div>`;
  html += `<div class="kv"><b>SUSEP:</b><span>${V(seguradora?.susep, 'a confirmar em Configurações')}</span></div>`;

  html += `<h2 class="sec">Dos fatos</h2>`;
  html += `<p>${
    vars.resumoFatos
      ? esc(vars.resumoFatos)
      : `Em ${D(vars.dataSinistro, 'data do sinistro')}, foi comunicado a esta seguradora o sinistro relativo ao bem segurado, dando início ao procedimento de regulação.`
  }</p>`;

  html += `<h2 class="sec">${esc(hipotese.label)}</h2>`;
  html += hipotese.corpo(vars, genero);

  if (vars.notificarResolucao === 'sim') {
    html += `<h2 class="sec">Da notificação de resolução do contrato</h2>`;
    html += `<p>Em razão dos fatos e fundamentos acima expostos, esta seguradora notifica ${G('o segurado', 'a segurada', genero)} da resolução do contrato de proteção referente à apólice/bilhete nº ${V(vars.apolice, 'nº')}, com efeitos a partir do recebimento desta comunicação, nos termos das Condições Gerais e da legislação aplicável.</p>`;
  }

  html += `<p>Permanecemos à disposição para esclarecimentos adicionais através dos canais de atendimento informados no bilhete de seguro.</p>`;
  html += `<div class="sign"><div class="line"></div>${V(seguradora?.nome, 'Seguradora')}</div>`;

  return hydrateExhibitSlots(html, []);
}
