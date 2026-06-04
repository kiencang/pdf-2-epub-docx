/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { PdfPageData } from './pdf-processor';

export class MarkdownRenderer {
  /**
   * Safe, regex-based Markdown-to-HTML parser for preview rendering
   */
  static renderMarkdownToHtml(markdown: string, pdfPages: PdfPageData[]): string {
    if (!markdown) return '';

    const allImages: any[] = [];
    pdfPages.forEach(page => {
      if (page.extractedImages) {
        allImages.push(...page.extractedImages);
      }
    });

    const escaped = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const lines = escaped.split('\n');
    let insideList = false;
    let insideOrderedList = false;
    let insideTable = false;
    let insideCodeBlock = false;
    let codeBlockContent: string[] = [];

    const processedLines = lines.map((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (insideCodeBlock) {
          insideCodeBlock = false;
          const code = codeBlockContent.join('\n');
          codeBlockContent = [];
          return `</code></pre>`;
        } else {
          insideCodeBlock = true;
          return `<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto mb-4"><code>`;
        }
      }

      if (insideCodeBlock) {
        codeBlockContent.push(line);
        return line;
      }

      if (trimmed.startsWith('# ')) {
        return `<h1 class="text-3xl font-extrabold font-sans text-slate-900 tracking-tight mt-8 mb-4 border-b pb-2 border-slate-100">${trimmed.substring(2)}</h1>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h2 class="text-2xl font-bold font-sans text-slate-800 tracking-tight mt-6 mb-3 border-b pb-1.5 border-slate-100">${trimmed.substring(3)}</h2>`;
      }
      if (trimmed.startsWith('### ')) {
        return `<h3 class="text-xl font-semibold font-sans text-slate-800 mt-4 mb-2">${trimmed.substring(4)}</h3>`;
      }

      if (trimmed.startsWith('&gt;')) {
        return `<blockquote class="border-l-4 border-indigo-500 pl-4 py-1 my-4 italic text-slate-600 bg-indigo-50/30 rounded-r-lg">${trimmed.substring(4).trim()}</blockquote>`;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        let itemsHtml = '';
        if (!insideList) {
          insideList = true;
          itemsHtml += `<ul class="list-disc list-inside space-y-1.5 my-4 text-slate-700 pl-2">`;
        }
        itemsHtml += `<li>${trimmed.substring(2)}</li>`;
        return itemsHtml;
      } else if (insideList && trimmed === '') {
        insideList = false;
        return `</ul>`;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        let itemsHtml = '';
        if (!insideOrderedList) {
          insideOrderedList = true;
          itemsHtml += `<ol class="list-decimal list-inside space-y-1.5 my-4 text-slate-700 pl-2">`;
        }
        const index = trimmed.indexOf(' ');
        itemsHtml += `<li>${trimmed.substring(index + 1)}</li>`;
        return itemsHtml;
      } else if (insideOrderedList && trimmed === '') {
        insideOrderedList = false;
        return `</ol>`;
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (trimmed.includes('---')) {
          return '';
        }
        let itemsHtml = '';
        if (!insideTable) {
          insideTable = true;
          itemsHtml += `<div class="overflow-x-auto my-6"><table class="w-full text-left text-xs border border-slate-150 rounded-xl overflow-hidden shadow-sm"><tbody>`;
        }
        const cells = trimmed.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        const rowTag = itemsHtml.includes('thead') || itemsHtml.includes('tr') ? 'td' : 'th';
        const rowClass = rowTag === 'th' ? 'bg-slate-100 font-bold p-3 border-b border-slate-200 text-slate-700' : 'p-3 border-b border-slate-100 text-slate-600 hover:bg-slate-50';
        
        itemsHtml += `<tr class="border-b border-slate-50">`;
        cells.forEach(cell => {
          itemsHtml += `<${rowTag} class="${rowClass}">${cell}</${rowTag}>`;
        });
        itemsHtml += `</tr>`;
        return itemsHtml;
      } else if (insideTable && !trimmed.startsWith('|')) {
        insideTable = false;
        return `</tbody></table></div>`;
      }

      // Convert ![IMG-XX] into base64 images
      const imageRegex = /!\[(IMG[-_]\d+)\]/gi;
      if (imageRegex.test(trimmed)) {
        return line.replace(imageRegex, (match, key) => {
          const indexStr = key.replace(/\D/g, '');
          const indexVal = parseInt(indexStr, 10) - 1;
          const img = allImages[indexVal];
          if (img) {
            return `
<div class="my-8 border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white p-3 max-w-2xl mx-auto-fluid no-print">
  <div class="relative bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center max-h-[30rem] p-3">
    <img src="${img.dataUrl}" alt="${key}" class="max-w-full max-h-full object-contain hover:scale-[1.01] transition-transform duration-300 cursor-zoom-in" onclick="window.zoomPdfImage && window.zoomPdfImage(this.src)" referrerpolicy="no-referrer" />
  </div>
  <div class="text-center text-[11px] text-slate-400 font-mono mt-3">Hình ảnh ${key} • Đặt đúng vị trí bằng AI</div>
</div>
`;
          } else {
            return `
<div class="pdf-image-placeholder my-6 border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50">
  <span class="text-xs text-slate-400 font-mono">Hình ảnh [${key}] (Đang nạp từ IndexedDB...)</span>
</div>
`;
          }
        });
      }

      if (trimmed === '') return '';
      return `<p class="mb-4 text-justify text-slate-700 leading-relaxed text-base">${trimmed}</p>`;
    });

    let joined = processedLines.join('\n');
    
    joined = joined
      .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([\s\S]*?)\*/g, '<em>$1</em>')
      .replace(/`([^`\n]+)`/g, '<code class="px-1.5 py-0.5 bg-slate-50 text-indigo-600 font-mono text-xs rounded border border-slate-100">$1</code>');

    joined = joined.replace(/<p class="mb-4 text-justify text-slate-700 leading-relaxed text-base"><\/p>/g, '');

    return joined;
  }

  /**
   * Safe Standard XML/XHTML compiler for strict eBook reader compatibility of EPUB formats
   */
  static markdownToXhtml(markdown: string): string {
    if (!markdown) return '';

    const escaped = markdown
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

    const lines = escaped.split('\n');
    let insideList = false;
    let insideOrderedList = false;
    let insideTable = false;
    let insideCodeBlock = false;
    let codeBlockContent: string[] = [];

    const processedLines = lines.map((line) => {
      const trimmed = line.trim();

      if (trimmed.startsWith('```')) {
        if (insideCodeBlock) {
          insideCodeBlock = false;
          const code = codeBlockContent.join('\n');
          codeBlockContent = [];
          return `</code></pre>`;
        } else {
          insideCodeBlock = true;
          return `<pre><code>`;
        }
      }

      if (insideCodeBlock) {
        codeBlockContent.push(line);
        return line;
      }

      if (trimmed.startsWith('# ')) {
        return `<h1>${trimmed.substring(2)}</h1>`;
      }
      if (trimmed.startsWith('## ')) {
        return `<h2>${trimmed.substring(3)}</h2>`;
      }
      if (trimmed.startsWith('### ')) {
        return `<h3>${trimmed.substring(4)}</h3>`;
      }

      if (trimmed.startsWith('&gt;')) {
        return `<blockquote>${trimmed.substring(4).trim()}</blockquote>`;
      }

      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        let itemsHtml = '';
        if (!insideList) {
          insideList = true;
          itemsHtml += `<ul>`;
        }
        itemsHtml += `<li>${trimmed.substring(2)}</li>`;
        return itemsHtml;
      } else if (insideList && trimmed === '') {
        insideList = false;
        return `</ul>`;
      }

      if (/^\d+\.\s/.test(trimmed)) {
        let itemsHtml = '';
        if (!insideOrderedList) {
          insideOrderedList = true;
          itemsHtml += `<ol>`;
        }
        const index = trimmed.indexOf(' ');
        itemsHtml += `<li>${trimmed.substring(index + 1)}</li>`;
        return itemsHtml;
      } else if (insideOrderedList && trimmed === '') {
        insideOrderedList = false;
        return `</ol>`;
      }

      if (trimmed.startsWith('|') && trimmed.endsWith('|')) {
        if (trimmed.includes('---')) {
          return '';
        }
        let itemsHtml = '';
        if (!insideTable) {
          insideTable = true;
          itemsHtml += `<table><tbody>`;
        }
        const cells = trimmed.split('|').map(c => c.trim()).filter((c, idx, arr) => idx > 0 && idx < arr.length - 1);
        const rowTag = itemsHtml.includes('thead') || itemsHtml.includes('tr') ? 'td' : 'th';
        itemsHtml += `<tr>`;
        cells.forEach(cell => {
          itemsHtml += `<${rowTag}>${cell}</${rowTag}>`;
        });
        itemsHtml += `</tr>`;
        return itemsHtml;
      } else if (insideTable && !trimmed.startsWith('|')) {
        insideTable = false;
        return `</tbody></table>`;
      }

      const imageRegex = /!\[(IMG[-_]\d+)\]/gi;
      if (imageRegex.test(trimmed)) {
        return line.replace(imageRegex, (match, key) => {
          const indexStr = key.replace(/\D/g, '');
          const imgFileName = `images/IMG-${indexStr.padStart(2, '0')}.png`;
          return `<img src="${imgFileName}" alt="${key}" />`;
        });
      }

      if (trimmed === '') return '';
      return `<p>${trimmed}</p>`;
    });

    let joined = processedLines.join('\n');
    joined = joined
      .replace(/\*\*([\s\S]*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*([\s\S]*?)\*/g, '<em>$1</em>')
      .replace(/`([^`\n]+)`/g, '<code>$1</code>');

    joined = joined.replace(/<p><\/p>/g, '');

    return joined;
  }
}
