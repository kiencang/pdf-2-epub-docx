/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import { PdfPageData } from './pdf-processor';
import { marked } from 'marked';

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

    const imageRegex = /!\[(IMG[-_]\d+)\]/gi;
    const processedMarkdown = markdown.replace(imageRegex, (match, key) => {
      const indexStr = key.replace(/\D/g, '');
      const indexVal = parseInt(indexStr, 10) - 1;
      const img = allImages[indexVal];
      if (img) {
        return `\n<div class="my-8 border border-slate-100 rounded-3xl overflow-hidden shadow-sm bg-white p-3 max-w-2xl mx-auto-fluid no-print">
  <div class="relative bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center max-h-[30rem] p-3">
    <img src="${img.dataUrl}" alt="${key}" class="max-w-full max-h-full object-contain hover:scale-[1.01] transition-transform duration-300 cursor-zoom-in" onclick="window.zoomPdfImage && window.zoomPdfImage(this.src)" referrerpolicy="no-referrer" />
  </div>
</div>\n`;
      } else {
        return `\n<div class="pdf-image-placeholder my-6 border border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center bg-slate-50">
  <span class="text-xs text-slate-400 font-mono">Đang nạp ảnh ${key}...</span>
</div>\n`;
      }
    });

    let html = '';
    try {
      html = marked.parse(processedMarkdown, { breaks: true, async: false }) as string;
    } catch(e) {
      console.warn("marked error", e);
      html = `<pre>${processedMarkdown}</pre>`;
    }

    let rendered = html;
    rendered = rendered.replace(/<h1(.*?)>/g, '<h1 class="text-3xl font-extrabold font-sans text-slate-900 tracking-tight mt-8 mb-4 border-b pb-2 border-slate-100 break-words"$1>')
                       .replace(/<h2(.*?)>/g, '<h2 class="text-2xl font-bold font-sans text-slate-800 tracking-tight mt-6 mb-3 border-b pb-1.5 border-slate-100 break-words"$1>')
                       .replace(/<h3(.*?)>/g, '<h3 class="text-xl font-semibold font-sans text-slate-800 mt-4 mb-2 break-words"$1>')
                       .replace(/<h4(.*?)>/g, '<h4 class="text-lg font-semibold font-sans text-slate-800 mt-4 mb-2 break-words"$1>')
                       .replace(/<p(.*?)>/g, '<p class="mb-4 text-justify text-slate-700 leading-relaxed text-base break-words"$1>')
                       .replace(/<blockquote(.*?)>/g, '<blockquote class="border-l-4 border-indigo-500 pl-4 py-1 my-4 italic text-slate-600 bg-indigo-50/30 rounded-r-lg break-words"$1>')
                       .replace(/<ul(.*?)>/g, '<ul class="list-disc list-inside space-y-1.5 my-4 text-slate-700 pl-2 break-words"$1>')
                       .replace(/<ol(.*?)>/g, '<ol class="list-decimal list-inside space-y-1.5 my-4 text-slate-700 pl-2 break-words"$1>')
                       .replace(/<table(.*?)>/g, '<div class="overflow-x-auto my-6"><table class="w-full text-left text-xs border border-slate-150 rounded-xl overflow-hidden shadow-sm break-words"$1>')
                       .replace(/<\/table>/g, '</table></div>')
                       .replace(/<thead(.*?)>/g, '<thead class="bg-slate-100 border-b border-slate-200 text-slate-700"$1>')
                       .replace(/<th(.*?)>/g, '<th class="font-bold p-3"$1>')
                       .replace(/<tbody(.*?)>/g, '<tbody class="divide-y divide-slate-50 border-b border-slate-100"$1>')
                       .replace(/<td(.*?)>/g, '<td class="p-3 text-slate-600 hover:bg-slate-50"$1>')
                       .replace(/<pre(.*?)>/g, '<pre class="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-xs overflow-x-auto mb-4"$1>')
                       .replace(/(?<!<pre[^>]*>)<code(.*?)>/g, '<code class="px-1.5 py-0.5 bg-slate-50 text-indigo-600 font-mono text-xs rounded border border-slate-100 break-words"$1>')
                       .replace(/<a(.*?)>/g, '<a class="text-indigo-600 hover:text-indigo-500 underline break-words font-medium transition-colors cursor-pointer" rel="noopener noreferrer" target="_blank"$1>');

    return rendered;
  }

  /**
   * Safe Standard XML/XHTML compiler for strict eBook reader compatibility of EPUB formats
   */
  static markdownToXhtml(markdown: string): string {
    if (!markdown) return '';

    const imageRegex = /!\[(IMG[-_]\d+)\]/gi;
    const processedMarkdown = markdown.replace(imageRegex, (match, key) => {
      const indexStr = key.replace(/\D/g, '');
      const imgFileName = `images/IMG-${indexStr.padStart(2, '0')}.png`;
      return `![${key}](${imgFileName})`;
    });

    let rendered = '';
    try {
      rendered = marked.parse(processedMarkdown, { breaks: true, async: false }) as string;
    } catch(e) {
      console.warn("marked error", e);
      rendered = processedMarkdown;
    }
    
    // Ensure standard EPUB XHTML compatibility for unclosed valid HTML tags:
    rendered = rendered.replace(/<img(.*?)>/g, (match, p1) => {
      if (p1.endsWith('/')) return match;
      return `<img${p1} />`;
    }).replace(/<br(.*?)>/g, (match, p1) => {
      if (p1.endsWith('/')) return match;
      return `<br${p1} />`;
    }).replace(/<hr(.*?)>/g, (match, p1) => {
      if (p1.endsWith('/')) return match;
      return `<hr${p1} />`;
    });

    return rendered;
  }
}
