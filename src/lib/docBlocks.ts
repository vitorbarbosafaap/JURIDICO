// Structured document model shared by every document-generating tool
// (Gerador de Subsídios, Gerador de Cartas de Recusa/Notificação).
// A single DocBlock[] tree renders both to the on-screen serif preview
// (renderDocBlocksToHTML) and to a downloadable .docx (see docxExport.ts) —
// avoiding fragile HTML → docx parsing.

export interface DocRun {
  text: string;
  bold?: boolean;
  italic?: boolean;
}

export type DocParagraphContent = string | DocRun[];

export type DocBlock =
  | { kind: 'title'; text: string }
  | { kind: 'addressee'; to: string; extra?: string }
  | { kind: 'meta'; text: string }
  | { kind: 'heading'; text: string }
  | { kind: 'paragraph'; content: DocParagraphContent }
  | { kind: 'keyvalue'; items: { label: string; value: string }[] }
  | { kind: 'table'; rows: { label: string; value: string; total?: boolean }[] }
  | { kind: 'signature'; label: string };

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function runsToHTML(content: DocParagraphContent): string {
  const runs = typeof content === 'string' ? [{ text: content }] : content;
  return runs
    .map((r) => {
      let t = esc(r.text);
      if (r.bold) t = `<b>${t}</b>`;
      if (r.italic) t = `<i>${t}</i>`;
      return t;
    })
    .join('');
}

/**
 * Replaces `<div class="exhibit" data-slot="ID"></div>` placeholders (produced by
 * the legal catalogs to mark where a supporting document belongs) with a static
 * checklist note — documents are referenced by link elsewhere in the app, not
 * embedded as binaries, so there is nothing to upload inline here.
 */
export function hydrateExhibitSlots(html: string, docs: { id: string; label: string }[]): string {
  return html.replace(/<div class="exhibit" data-slot="([^"]+)"><\/div>/g, (_match, slotId) => {
    const idx = docs.findIndex((d) => d.id === slotId);
    if (idx === -1) return '';
    const num = String(idx + 1).padStart(2, '0');
    return `<div class="exhibit-note">📎 <span><b>Doc. ${esc(num)}</b> — ${esc(docs[idx].label)}</span></div>`;
  });
}

export function renderDocBlocksToHTML(blocks: DocBlock[]): string {
  return blocks
    .map((b) => {
      switch (b.kind) {
        case 'title':
          return `<h1 class="doctitle">${esc(b.text)}</h1>`;
        case 'addressee':
          return `<div class="addr-block"><div class="to">À<br>${esc(b.to)}${b.extra ? `<br>${esc(b.extra)}` : ''}</div></div>`;
        case 'meta':
          return `<p class="doc-meta">${esc(b.text)}</p>`;
        case 'heading':
          return `<h2 class="sec">${esc(b.text)}</h2>`;
        case 'paragraph':
          return `<p>${runsToHTML(b.content)}</p>`;
        case 'keyvalue':
          return b.items.map((kv) => `<div class="kv"><b>${esc(kv.label)}:</b><span>${esc(kv.value)}</span></div>`).join('');
        case 'table':
          return `<table class="reqs-table">${b.rows
            .map((r) => `<tr${r.total ? ' class="total"' : ''}><td>${esc(r.label)}</td><td class="v">${esc(r.value)}</td></tr>`)
            .join('')}</table>`;
        case 'signature':
          return `<div class="sign"><div class="line"></div>${esc(b.label)}</div>`;
        default:
          return '';
      }
    })
    .join('\n');
}
