import {
  AlignmentType,
  Document,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
  BorderStyle,
} from 'docx';
import { saveAs } from 'file-saver';
import type { DocBlock, DocParagraphContent, DocRun } from './docBlocks';

const SERIF_FONT = 'Times New Roman';

function runsOf(content: DocParagraphContent): DocRun[] {
  return typeof content === 'string' ? [{ text: content }] : content;
}

function toTextRuns(content: DocParagraphContent): TextRun[] {
  return runsOf(content).map(
    (r) => new TextRun({ text: r.text, bold: r.bold, italics: r.italic, font: SERIF_FONT, size: 24 }),
  );
}

function noBorder() {
  return { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
}

function blockToDocxElements(block: DocBlock): (Paragraph | Table)[] {
  switch (block.kind) {
    case 'title':
      return [
        new Paragraph({
          alignment: AlignmentType.RIGHT,
          spacing: { after: 300 },
          children: [new TextRun({ text: block.text, bold: true, font: 'Calibri', size: 22 })],
        }),
      ];
    case 'addressee':
      return [
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: 'À', font: 'Calibri', size: 21 }),
            new TextRun({ break: 1 }),
            new TextRun({ text: block.to, font: 'Calibri', size: 21 }),
            ...(block.extra ? [new TextRun({ break: 1 }), new TextRun({ text: block.extra, font: 'Calibri', size: 21 })] : []),
          ],
        }),
      ];
    case 'meta':
      return [
        new Paragraph({
          spacing: { after: 150 },
          children: [new TextRun({ text: block.text, font: 'Calibri', size: 18, color: '64748B' })],
        }),
      ];
    case 'heading':
      return [
        new Paragraph({
          spacing: { before: 300, after: 150 },
          border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: 'C2410C' } },
          children: [
            new TextRun({ text: block.text.toUpperCase(), bold: true, font: 'Calibri', size: 18, color: 'C2410C' }),
          ],
        }),
      ];
    case 'paragraph':
      return [
        new Paragraph({
          alignment: AlignmentType.JUSTIFIED,
          spacing: { after: 200, line: 360 },
          children: toTextRuns(block.content),
        }),
      ];
    case 'keyvalue':
      return block.items.map(
        (kv) =>
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({ text: `${kv.label}: `, bold: true, font: 'Calibri', size: 20 }),
              new TextRun({ text: kv.value, font: 'Calibri', size: 20 }),
            ],
          }),
      );
    case 'table':
      return [
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          borders: {
            top: noBorder(),
            bottom: noBorder(),
            left: noBorder(),
            right: noBorder(),
            insideHorizontal: noBorder(),
            insideVertical: noBorder(),
          },
          rows: block.rows.map(
            (r) =>
              new TableRow({
                children: [
                  new TableCell({
                    width: { size: 70, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        children: [new TextRun({ text: r.label, bold: !!r.total, font: 'Calibri', size: 20 })],
                      }),
                    ],
                  }),
                  new TableCell({
                    width: { size: 30, type: WidthType.PERCENTAGE },
                    children: [
                      new Paragraph({
                        alignment: AlignmentType.RIGHT,
                        children: [new TextRun({ text: r.value, bold: !!r.total, font: 'Calibri', size: 20 })],
                      }),
                    ],
                  }),
                ],
              }),
          ),
        }),
      ];
    case 'signature':
      return [
        new Paragraph({ spacing: { before: 600 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '_______________________________', font: 'Calibri', size: 20 })] }),
        new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: block.label, font: 'Calibri', size: 20 })] }),
      ];
    default:
      return [];
  }
}

export async function exportDocBlocksToDocx(blocks: DocBlock[], filename: string): Promise<void> {
  const children = blocks.flatMap(blockToDocxElements);
  const doc = new Document({
    sections: [
      {
        properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
        children,
      },
    ],
  });
  const blob = await Packer.toBlob(doc);
  saveAs(blob, filename.endsWith('.docx') ? filename : `${filename}.docx`);
}
