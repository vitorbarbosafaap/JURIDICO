import type { DocBlock, DocRun } from './docBlocks';

// Parses the specific, constrained HTML vocabulary produced by the document
// generators (Gerador de Subsídios, Gerador de Cartas) — h1.doctitle,
// div.addr-block, p.doc-meta, h2.sec, p, div.kv, table.reqs-table, div.sign,
// div.exhibit-note — into the shared DocBlock model so the same content that
// renders on screen can also be exported to .docx.

function inlineRuns(node: ChildNode): DocRun[] {
  const runs: DocRun[] = [];
  node.childNodes.forEach((child) => {
    if (child.nodeType === Node.TEXT_NODE) {
      const text = child.textContent ?? '';
      if (text) runs.push({ text });
      return;
    }
    if (child.nodeType !== Node.ELEMENT_NODE) return;
    const el = child as HTMLElement;
    const text = el.textContent ?? '';
    if (!text) return;
    if (el.tagName === 'B' || el.tagName === 'STRONG') runs.push({ text, bold: true });
    else if (el.tagName === 'I' || el.tagName === 'EM' || el.classList.contains('ph')) runs.push({ text, italic: true });
    else runs.push(...inlineRuns(el));
  });
  return runs;
}

export function htmlToDocBlocks(html: string): DocBlock[] {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;
  if (!root) return [];

  const blocks: DocBlock[] = [];
  let pendingKv: { label: string; value: string }[] = [];

  function flushKv() {
    if (pendingKv.length) {
      blocks.push({ kind: 'keyvalue', items: pendingKv });
      pendingKv = [];
    }
  }

  Array.from(root.children).forEach((el) => {
    const tag = el.tagName.toLowerCase();
    const cls = el.className;

    if (tag === 'h1' && cls.includes('doctitle')) {
      flushKv();
      blocks.push({ kind: 'title', text: el.textContent ?? '' });
      return;
    }
    if (tag === 'div' && cls.includes('addr-block')) {
      flushKv();
      const to = el.querySelector('.to');
      const html2 = to?.innerHTML ?? '';
      const parts = html2.split('<br>').map((s) => s.replace(/<[^>]+>/g, '').trim()).filter(Boolean);
      blocks.push({ kind: 'addressee', to: parts[0] ?? '', extra: parts.slice(1).join(' — ') || undefined });
      return;
    }
    if (tag === 'p' && cls.includes('doc-meta')) {
      flushKv();
      blocks.push({ kind: 'meta', text: el.textContent ?? '' });
      return;
    }
    if (tag === 'h2' && cls.includes('sec')) {
      flushKv();
      blocks.push({ kind: 'heading', text: el.textContent ?? '' });
      return;
    }
    if (tag === 'div' && cls.includes('kv')) {
      const b = el.querySelector('b');
      const span = el.querySelector('span');
      const label = (b?.textContent ?? '').replace(/:$/, '');
      const value = span?.textContent ?? '';
      pendingKv.push({ label, value });
      return;
    }
    if (tag === 'table' && cls.includes('reqs-table')) {
      flushKv();
      const rows = Array.from(el.querySelectorAll('tr')).map((tr) => {
        const tds = tr.querySelectorAll('td');
        return {
          label: tds[0]?.textContent ?? '',
          value: tds[1]?.textContent ?? '',
          total: tr.className.includes('total'),
        };
      });
      blocks.push({ kind: 'table', rows });
      return;
    }
    if (tag === 'div' && cls.includes('exhibit-note')) {
      flushKv();
      blocks.push({ kind: 'paragraph', content: [{ text: el.textContent ?? '', italic: true }] });
      return;
    }
    if (tag === 'div' && cls.includes('sign')) {
      flushKv();
      const label = (el.textContent ?? '').trim();
      blocks.push({ kind: 'signature', label });
      return;
    }
    if (tag === 'p') {
      flushKv();
      blocks.push({ kind: 'paragraph', content: inlineRuns(el) });
      return;
    }
    // Unrecognized block (e.g. leftover raw exhibit slot) — skip silently.
  });

  flushKv();
  return blocks;
}
