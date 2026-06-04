import { PdfPageData } from './pdf-processor';

export class ClientMarkdownGenerator {
  /**
   * Generates local markdown preview skeleton for unmatched files
   */
  static generateDefaultClientMarkdown(pages: PdfPageData[]): string {
    let md = '';
    let globalImageIdx = 1;

    pages.forEach(page => {
      md += `## Trang số ${page.pageNum}\n\n`;

      const items = [...page.items];
      items.sort((a, b) => {
        const diffY = b.transform[5] - a.transform[5];
        if (Math.abs(diffY) > 6) return diffY;
        return a.transform[4] - b.transform[4];
      });

      const lines: { y: number; text: string }[] = [];
      let currentY = -1;
      let currentText = '';

      items.forEach((item) => {
        const y = item.transform[5];
        if (currentY === -1) {
          currentY = y;
          currentText = item.text;
        } else if (Math.abs(currentY - y) < 7) {
          if (currentText && !currentText.endsWith(' ') && !item.text.startsWith(' ')) {
            currentText += ' ';
          }
          currentText += item.text;
        } else {
          lines.push({ y: currentY, text: currentText });
          currentY = y;
          currentText = item.text;
        }
      });
      if (currentText) {
        lines.push({ y: currentY, text: currentText });
      }

      let currentParagraph = '';
      lines.forEach((line, lIdx) => {
        const text = line.text.trim();
        if (!text) return;

        const isHeading = text.length < 80 && (
          text.toUpperCase() === text ||
          /^(CHƯƠNG|MỤC|PHẦN|CHAPTER|SECTION|ARTICLE|PHỤ LỤC|I\.|II\.|III\.|IV\.)/gi.test(text) ||
          (lines[lIdx - 1] && Math.abs(lines[lIdx - 1].y - line.y) > 28)
        );

        if (isHeading) {
          if (currentParagraph) {
            md += `${currentParagraph}\n\n`;
            currentParagraph = '';
          }
          md += `### ${text}\n\n`;
        } else {
          const bigGap = lines[lIdx - 1] && Math.abs(lines[lIdx - 1].y - line.y) > 20;
          if (bigGap && currentParagraph) {
            md += `${currentParagraph}\n\n`;
            currentParagraph = text;
          } else {
            if (currentParagraph) {
              if (currentParagraph.endsWith('-')) {
                currentParagraph = currentParagraph.slice(0, -1) + text;
              } else {
                currentParagraph += ' ' + text;
              }
            } else {
              currentParagraph = text;
            }
          }
        }
      });

      if (currentParagraph) {
        md += `${currentParagraph}\n\n`;
      }

      if (page.extractedImages && page.extractedImages.length > 0) {
        page.extractedImages.forEach(() => {
          md += `![IMG-${String(globalImageIdx).padStart(2, '0')}]\n\n`;
          globalImageIdx++;
        });
      }
    });

    return md;
  }
}
