/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  afterNextRender,
  signal,
  computed
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PdfProcessor, PdfPageData } from './pdf-processor';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-root',
  imports: [CommonModule, MatIconModule],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App {
  private platformId = inject(PLATFORM_ID);
  private pdfProcessor = inject(PdfProcessor);

  // Script and loading state
  isScriptLoaded = computed(() => this.pdfProcessor.isScriptLoaded());
  isParsing = signal(false);
  isOptimizing = signal(false);
  parsingStatus = signal('');
  apiError = signal('');
  successMessage = signal('');

  // Loaded document details
  fileName = signal('');
  fileSize = signal('');
  pdfPages = signal<PdfPageData[]>([]);

  // Computed fields
  totalPageCount = computed(() => this.pdfPages().length);
  extractedImagesCount = computed(() => {
    return this.pdfPages().reduce((sum, page) => sum + (page.extractedImages?.length || 0), 0);
  });
  extractedText = computed(() => {
    return this.pdfPages()
      .map(p => p.items.map(i => i.text).join(' '))
      .join('\n\n');
  });

  // UI state
  showApiKey = signal(false);
  showApiKeyModal = signal(false);
  isDevMode = signal(false);
  tempApiKey = signal('');
  private successTimeout: any = null;
  selectedTab = signal<'reflow' | 'pdf' | 'source' | 'markdown'>('reflow');
  activeReflowMode = signal<'client' | 'ai'>('client');
  themeStyle = signal<'clean' | 'warm' | 'mono'>('clean');

  // AI Configuration Options
  clientApiKey = signal('');

  // Markdown representations
  clientMarkdown = signal('');
  aiMarkdown = signal('');

  // HTML representations (rendered from Markdown)
  clientReflowHtml = signal('');
  aiReflowHtml = signal('');

  // Image Lighbox Modal
  zoomImageUrl = signal<string | null>(null);
  showInstruction = signal(false);

  constructor() {
    afterNextRender(() => {
      this.loadPdfEngine();
      
      // Load user API key from safe localStorage
      const savedKey = localStorage.getItem('user_gemini_api_key') || '';
      this.clientApiKey.set(savedKey);

      // Bind safe handler to global window object
      (window as any).zoomPdfImage = (src: string) => {
        this.zoomImageUrl.set(src);
      };
    });
  }

  openApiKeyModal() {
    this.tempApiKey.set(this.clientApiKey());
    this.showApiKeyModal.set(true);
  }

  showSuccess(msg: string) {
    this.successMessage.set(msg);
    if (this.successTimeout) {
      clearTimeout(this.successTimeout);
    }
    if (msg) {
      this.successTimeout = setTimeout(() => {
        this.successMessage.set('');
      }, 7000);
    }
  }

  saveApiKeyModal() {
    this.updateApiKey(this.tempApiKey());
    this.showApiKeyModal.set(false);
    this.showSuccess('Đã cấu hình API Key thành công!');
  }

  clearApiKeyModal() {
    this.updateApiKey('');
    this.showApiKeyModal.set(false);
    this.showSuccess('Đã xóa cấu hình API Key cá nhân!');
  }

  /**
   * Save API Key safely to localStorage
   */
  updateApiKey(key: string) {
    const trimmed = key.trim();
    this.clientApiKey.set(trimmed);
    localStorage.setItem('user_gemini_api_key', trimmed);
  }

  /**
   * Loaded engine from web standard CDN cdnjs
   */
  private async loadPdfEngine() {
    await this.pdfProcessor.loadPdfEngine(
      (msg) => this.parsingStatus.set(msg),
      (msg) => this.apiError.set(msg)
    );
  }

  /**
   * Handle uploaded PDF file
   */
  async onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    await this.processPdfFile(file);
  }

  /**
   * Drag & Drop mechanics
   */
  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  async onFileDropped(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        await this.processPdfFile(file);
      } else {
        this.apiError.set('Định dạng tệp không được hỗ trợ. Vui lòng kéo thả tệp tin PDF.');
      }
    }
  }

  /**
   * Deep extract PDF structure
   */
  private async processPdfFile(file: File) {
    if (!this.isScriptLoaded() || !this.pdfProcessor.getPdfjsLib()) {
      this.apiError.set('Thư viện PDF.js đang được nạp, xin hãy đợi một giây rồi thử lại!');
      return;
    }

    const pdfjsLib = this.pdfProcessor.getPdfjsLib();
    this.isParsing.set(true);
    this.apiError.set('');
    this.showSuccess('');
    this.fileName.set(file.name);
    this.fileSize.set(this.pdfProcessor.formatBytes(file.size));
    this.pdfPages.set([]);
    this.clientReflowHtml.set('');
    this.aiReflowHtml.set('');
    this.clientMarkdown.set('');
    this.aiMarkdown.set('');
    this.activeReflowMode.set('client');

    try {
      this.parsingStatus.set('Đang dọn dẹp bộ nhớ ảnh cũ trong IndexedDB...');
      await this.pdfProcessor.clearStoredImagesForFile(file.name);

      const fileReader = new FileReader();
      const arrayBuffer = await new Promise<ArrayBuffer>((resolve, reject) => {
        fileReader.onload = () => resolve(fileReader.result as ArrayBuffer);
        fileReader.onerror = (err) => reject(err);
        fileReader.readAsArrayBuffer(file);
      });

      this.parsingStatus.set('Đang nạp file vào không gian ảo...');
      const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;

      const itemsExtracted: PdfPageData[] = [];

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        this.parsingStatus.set(`Trích xuất nội dung: Trang ${pageNum} / ${pdf.numPages}...`);
        const page = await pdf.getPage(pageNum);

        // 1. Text parsing
        const textContent = await page.getTextContent();
        const textItems = textContent.items.map((item: any) => ({
          text: item.str,
          transform: item.transform, // coordinates
          width: item.width,
          height: item.height,
        }));

        // 2. High-quality canvas rendering to generate preview page image
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d')!;
        
        await page.render({
          canvasContext: ctx,
          viewport: viewport
        }).promise;

        const pageImageUrl = canvas.toDataURL('image/jpeg', 0.85);

        // 3. Isolated images extraction from Operators
        this.parsingStatus.set(`Tách lập hình ảnh trang ${pageNum}...`);
        const extractedImages = await this.pdfProcessor.extractImagesFromPage(page);

        itemsExtracted.push({
          pageNum,
          items: textItems,
          pageImageUrl,
          extractedImages
        });
      }

      this.pdfPages.set(itemsExtracted);
      this.parsingStatus.set('Đang đặt gán nhãn ảnh và lưu vào cơ sở dữ liệu IndexedDB trình duyệt...');
      
      // Save images sequentially to IndexedDB with IMG-XX keys
      let globalImageIdx = 1;
      for (const page of itemsExtracted) {
        if (page.extractedImages) {
          for (const img of page.extractedImages) {
            const labelKey = `IMG-${String(globalImageIdx).padStart(2, '0')}`;
            img.labeledKey = labelKey; // Assign sequential label
            
            await this.pdfProcessor.saveImageToDb({
              id: `${file.name}_${labelKey}`,
              key: labelKey,
              fileName: file.name,
              pageNum: page.pageNum,
              dataUrl: img.dataUrl,
              width: img.width,
              height: img.height
            });
            globalImageIdx++;
          }
        }
      }

      this.parsingStatus.set('Đang thiết lập bản cấu trúc Markdown xem trước...');

      // Generate default client markdown layout
      const clientMd = this.pdfProcessor.generateDefaultClientMarkdown(itemsExtracted);
      this.clientMarkdown.set(clientMd);

      // Render default markdown to beautiful HTML for reading tab
      const clientHtml = this.pdfProcessor.renderMarkdownToHtml(clientMd, itemsExtracted);
      this.clientReflowHtml.set(clientHtml);

      this.selectedTab.set('pdf');
      this.showSuccess('Đã trích xuất ảnh thành công từ file PDF');
      this.isParsing.set(false);
      this.parsingStatus.set('');
    } catch (err: any) {
      console.error(err);
      this.apiError.set('Lỗi phân tích cú pháp tệp PDF: ' + (err.message || err));
      this.isParsing.set(false);
      this.parsingStatus.set('');
    }
  }

  /**
   * Optimize page text flow through Client-Side Gemini REST API
   */
  async optimizeWithAI() {
    if (!this.extractedText() || this.extractedText().trim() === '') {
      this.apiError.set('Không có dữ liệu văn bản để tối ưu. Vui lòng tải lên tài liệu PDF trước.');
      return;
    }

    const apiKey = this.clientApiKey().trim();
    if (!apiKey) {
      this.apiError.set('Vui lòng điền Gemini API Key của bạn ở mục *Nhập API Key* nằm ở phía trên bên phải.');
      return;
    }

    this.isOptimizing.set(true);
    this.apiError.set('');
    this.showSuccess('');

    try {
      const parts: any[] = [];
      
      let promptText = '';
      try {
        const response = await fetch('/prompts/reflow_instructions.md');
        if (!response.ok) throw new Error('Không thể tải tệp prompt từ server');
        const template = await response.text();
        promptText = template.replace('{{EXTRACTED_TEXT}}', this.extractedText());
      } catch (fetchErr) {
        console.warn('Lỗi fetch prompt template, sử dụng cấu hình mặc định:', fetchErr);
        promptText = `Bạn là một chuyên gia bóc tách tài liệu và cấu trúc tài liệu sang định dạng Markdown chuẩn chất lượng cao.
Dưới đây là nội dung văn bản bóc tách thô từ tài liệu PDF:
---
${this.extractedText()}
---

Và chúng tôi đính kèm dưới đây là danh sách các hình ảnh thực tế bóc tách được từ tài liệu này.
Nhiệm vụ của bạn:
1. Tái cấu trúc lại văn bản nguồn sạch sẽ thành định dạng Markdown chuẩn (sử dụng tiêu đề #, ##, ###, đoạn văn, danh sách - hoặc *, khối trích dẫn > , định dạng in đậm **text**, in nghiêng *text*, khối mã \`\`\` hoặc bảng biểu nếu có).
2. Tối ưu hóa cấu trúc dàn trang, tạo trải nghiệm đọc sách EPUB 3 mượt mà chuyên nghiệp nhất. Mặc định luôn giữ nguyên ngôn ngữ gốc của nội dung tài liệu.
3. Quan sát nội dung văn bản gốc và các hình ảnh được truyền vào để nhận diện ngữ cảnh, sau đó chèn chính xác thẻ hình ảnh Markdown, ví dụ: \`![IMG-01]\`, \`![IMG-02]\`,... vào ĐÚNG vị trí tương ứng trong văn bản Markdown mà hình ảnh đó đang diễn tả hoặc minh họa rõ nét.
   Lưu ý: Bạn không được lược bỏ bất kỳ ảnh nào được truyền vào, hãy sắp xếp tên ảnh đúng thứ tự xuất hiện của nó tương ứng với nội dung bàn luận.
4. KHÔNG thay đổi nhãn \`![IMG-XX]\` (Ví dụ: Giữ nguyên dạng ![IMG-01], không dịch nghĩa, không viết văn bản giải thích trong ngoặc vuông) để hệ thống có thể tự động liên kết dữ liệu ảnh thật từ IndexedDB chính xác.`;
      }

      promptText += `\n\nĐẦU RA CHỈ ĐƯỢC PHÉP CHỨA ĐOẠN MÃ MARKDOWN NÀY, không viết lời giới thiệu hay bọc dấu markdown \`\`\`markdown ... \`\`\` rườm rà. Bắt đầu mã Markdown ngay dưới đây:`;

      // 1. Core text prompt part
      parts.push({ text: promptText });

      // 2. Multimodal image structures containing actual base64 payloads to let AI recognize visual contents
      let imageIdx = 1;
      this.pdfPages().forEach(page => {
        if (page.extractedImages) {
          page.extractedImages.forEach(img => {
            const rawBase64 = img.dataUrl.split(',')[1];
            parts.push({
              text: `\nDưới đây là dữ liệu hình ảnh bóc được mang nhãn [IMG-${String(imageIdx).padStart(2, '0')}]:\n`
            });
            parts.push({
              inlineData: {
                mimeType: 'image/png',
                data: rawBase64
              }
            });
            imageIdx++;
          });
        }
      });

      // Use customized high speed gemini-flash-lite-latest model
      const modelName = 'gemini-flash-lite-latest';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;

      const apiResponse = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: parts
            }
          ],
          generationConfig: {
            temperature: 0.15
          }
        })
      });

      if (!apiResponse.ok) {
        const errorData = await apiResponse.json().catch(() => ({}));
        const originalError = errorData?.error?.message || `Lỗi HTTP ${apiResponse.status}`;
        throw new Error(`Google API phản hồi thất bại: ${originalError}`);
      }

      const resData = await apiResponse.json();
      let rawMarkdown = resData?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      if (!rawMarkdown) {
        throw new Error('Gemini API không phản hồi dữ liệu văn bản hợp lệ.');
      }

      // Strip markdown block wrapping if present
      if (rawMarkdown.includes('```')) {
        const match = rawMarkdown.match(/```(?:markdown)?([\s\S]*?)```/i);
        if (match && match[1]) {
          rawMarkdown = match[1].trim();
        }
      }

      this.aiMarkdown.set(rawMarkdown);
      
      // Parse output Markdown to HTML preview
      const renderedHtml = this.pdfProcessor.renderMarkdownToHtml(rawMarkdown, this.pdfPages());
      this.aiReflowHtml.set(renderedHtml);
      
      this.activeReflowMode.set('ai');
      this.selectedTab.set('reflow');
      this.showSuccess('Đã bóc tách cấu trúc và liên kết ảnh thành công bằng Mô hình Đa phương thức AI!');
    } catch (err: any) {
      console.error(err);
      this.apiError.set(err.message || 'Lỗi gửi yêu cầu AI trực tiếp. Xin kiểm tra lại tính chính xác của khóa API Key!');
    } finally {
      this.isOptimizing.set(false);
    }
  }

  /**
   * Triggers download of strict EPUB zip standard package
   */
  async downloadEpubFile() {
    const activeMarkdown = this.activeReflowMode() === 'ai' ? this.aiMarkdown() : this.clientMarkdown();
    if (!activeMarkdown || activeMarkdown.trim() === '') {
      this.apiError.set('Không có dữ liệu văn bản để chuyển đổi thành EPUB.');
      return;
    }

    const title = this.fileName().replace(/\.pdf$/i, '') || 'tai_lieu_chuyen_doi';
    this.isParsing.set(true);
    this.parsingStatus.set('Đang biên dịch tệp tin sách điện tử chuẩn EPUB 3...');
    
    try {
      const blob = await this.pdfProcessor.generateEpub(title, activeMarkdown, this.pdfPages());
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = title + '.epub';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      this.showSuccess('Tải tệp tin sách EPUB (.epub) thành công! Sách bọc đầy đủ hình ảnh và nhãn cấu trúc.');
    } catch (err: any) {
      console.error(err);
      this.apiError.set('Lỗi biên dịch tệp EPUB: ' + err.message);
    } finally {
      this.isParsing.set(false);
      this.parsingStatus.set('');
    }
  }

  /**
   * Download original clean .md Markdown file
   */
  downloadMarkdownFile() {
    const activeMarkdown = this.activeReflowMode() === 'ai' ? this.aiMarkdown() : this.clientMarkdown();
    if (!activeMarkdown || activeMarkdown.trim() === '') {
      this.apiError.set('Không có dữ liệu Markdown để tải.');
      return;
    }

    const title = this.fileName().replace(/\.pdf$/i, '') || 'tai_lieu_chuyen_doi';
    const blob = new Blob([activeMarkdown], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = title + '.md';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showSuccess('Đã tải tệp Markdown (.md) thành công!');
  }

  /**
   * Triggers file download of self-contained file
   */
  downloadHtmlFile() {
    const activeHtml = this.activeReflowMode() === 'ai' ? this.aiReflowHtml() : this.clientReflowHtml();
    
    let fontClass = 'font-sans';
    if (this.themeStyle() === 'mono') fontClass = 'font-mono';

    const fullHtmlSource = `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${this.fileName() || 'Tài liệu chuyển đổi - PDF HTML'}</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --font-sans: "Inter", sans-serif;
      --font-mono: "JetBrains Mono", monospace;
    }
    @media print {
      .no-print { display: none !important; }
      body { background-color: white !important; padding: 0 !important; }
      .print-shadow-none { box-shadow: none !important; border: none !important; }
    }
  </style>
</head>
<body class="bg-slate-50 text-slate-800 p-4 md:p-12 ${fontClass}">
  <div class="max-w-4xl mx-auto bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-16 print-shadow-none">
    <div class="no-print flex justify-between items-center mb-10 border-b pb-6 border-slate-100">
      <div class="text-xs text-slate-400 font-mono">Tài liệu đã chuyển đổi bằng PDF-to-HTML AI</div>
      <button onclick="window.print()" class="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">In tài liệu / Lưu PDF</button>
    </div>
    
    <div>
      ${activeHtml}
    </div>
  </div>
</body>
</html>`;

    const blob = new Blob([fullHtmlSource], { type: 'text/html;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = (this.fileName().replace(/\.pdf$/i, '') || 'tai_lieu_chuyen_doi') + '.html';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    this.showSuccess('Đã bắt đầu tải trang HTML tự chứa hình ảnh!');
  }
}
