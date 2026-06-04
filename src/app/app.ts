/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
import {
  ChangeDetectionStrategy,
  Component,
  PLATFORM_ID,
  inject,
  afterNextRender,
  signal,
  computed,
  effect
} from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { PdfProcessor, PdfPageData } from './pdf-processor';

export interface PdfChunk {
  id: string;
  index: number;
  startPageNum: number;
  endPageNum: number;
  pages: PdfPageData[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage: string;
  markdownContent: string;
  reflowHtml: string;
}

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
  private sanitizer = inject(DomSanitizer);


  // Script and loading state
  isScriptLoaded = computed(() => this.pdfProcessor.isScriptLoaded());
  isParsing = signal(false);
  isOptimizing = signal(false);
  isBatchProcessing = signal(false);
  shouldStopBatch = signal(false);
  selectedModel = signal<'gemini-flash-latest' | 'gemini-flash-lite-latest'>('gemini-flash-lite-latest');
  parsingStatus = signal('');
  apiError = signal('');
  successMessage = signal('');
  optimizationTimer = signal(0);
  private timerInterval: any = null;
  optimizationTimeFormatted = computed(() => {
    const s = this.optimizationTimer();
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  });

  // Loaded document details
  fileName = signal('');
  fileSize = signal('');
  pdfFile = signal<File | null>(null);
  pdfPages = signal<PdfPageData[]>([]);
  
  pdfChunks = signal<PdfChunk[]>([]);
  selectedChunkIndex = signal<number>(0);
  
  activeChunk = computed(() => {
    const chunks = this.pdfChunks();
    const idx = this.selectedChunkIndex();
    if (chunks && chunks.length > idx) return chunks[idx];
    return null;
  });

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
  private errorTimeout: any = null;
  selectedTab = signal<'reflow' | 'pdf' | 'source' | 'markdown'>('reflow');
  themeStyle = signal<'clean' | 'warm' | 'mono'>('clean');

  // AI Configuration Options
  clientApiKey = signal('');

  // Markdown representations
  markdownContent = computed(() => this.activeChunk()?.markdownContent || '');

  // HTML representations (rendered from Markdown)
  reflowHtml = computed(() => this.activeChunk()?.reflowHtml || '');
  
  reflowSafeHtml = computed(() => this.sanitizer.bypassSecurityTrustHtml(this.reflowHtml()));

  // Image Lighbox Modal
  zoomImageUrl = signal<string | null>(null);
  showInstruction = signal(false);

  constructor() {
    effect(() => {
      const err = this.apiError();
      if (err) {
        if (this.errorTimeout) {
          clearTimeout(this.errorTimeout);
        }
        this.errorTimeout = setTimeout(() => {
          this.apiError.set('');
        }, 12000);
      }
    });

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

    if (file.size > 50 * 1024 * 1024) {
      this.apiError.set(`Tài liệu vượt quá giới hạn 50MB (${this.pdfProcessor.formatBytes(file.size)}). Vui lòng chọn tệp nhỏ hơn.`);
      return;
    }

    const pdfjsLib = this.pdfProcessor.getPdfjsLib();
    this.isParsing.set(true);
    this.apiError.set('');
    this.showSuccess('');
    this.fileName.set(file.name);
    this.fileSize.set(this.pdfProcessor.formatBytes(file.size));
    this.pdfFile.set(file);
    this.pdfPages.set([]);
    this.pdfChunks.set([]);
    this.selectedChunkIndex.set(0);

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

      if (pdf.numPages > 500) {
        this.apiError.set(`Tài liệu có ${pdf.numPages} trang, vượt quá giới hạn 500 trang. Vui lòng cắt nhỏ tệp PDF trước khi xử lý.`);
        this.isParsing.set(false);
        this.parsingStatus.set('');
        return;
      }

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
      
      const createChunks = (pages: PdfPageData[]): PdfChunk[] => {
        const chunks: PdfChunk[] = [];
        const divide = (p: PdfPageData[]) => {
          if (p.length <= 25) {
             if (p.length > 0) {
                chunks.push({
                  id: '',
                  index: chunks.length,
                  startPageNum: p[0].pageNum,
                  endPageNum: p[p.length - 1].pageNum,
                  pages: p,
                  status: 'pending',
                  errorMessage: '',
                  markdownContent: '',
                  reflowHtml: ''
                });
             }
             return;
          }
          const mid = Math.floor(p.length / 2);
          divide(p.slice(0, mid));
          divide(p.slice(mid));
        };
        divide(pages);
        return chunks;
      };
      
      const generatedChunks = createChunks(itemsExtracted);

      this.parsingStatus.set('Đang đặt gán nhãn ảnh và lưu vào cơ sở dữ liệu IndexedDB trình duyệt...');
      
      // Save images sequentially to IndexedDB with IMG-CHUNKXX-XX keys
      let chunkCounter = 1;
      for (const chunk of generatedChunks) {
        chunk.id = `Phần ${chunkCounter}`;
        
        let imageIdxInChunk = 1;
        for (const page of chunk.pages) {
          if (page.extractedImages) {
            for (const img of page.extractedImages) {
              const labelKey = `IMG-CHUNK${chunkCounter}-${String(imageIdxInChunk).padStart(2, '0')}`;
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
              imageIdxInChunk++;
            }
          }
        }
        chunkCounter++;
      }

      this.pdfChunks.set(generatedChunks);

      this.parsingStatus.set('Đang thiết lập bản gốc...');

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
   * Core function to perform text/image reflow optimization on a specific chunk
   */
  private async executeChunkOptimization(chunkIndex: number): Promise<void> {
    const file = this.pdfFile();
    const chunks = this.pdfChunks();
    const chunk = chunks[chunkIndex];

    if (!file || !chunk) {
      throw new Error('Không tìm thấy file nguồn hoặc phần phân chia.');
    }

    const apiKey = this.clientApiKey().trim();
    if (!apiKey) {
      throw new Error('Vui lòng cấu hình Gemini API Key trước khi thực hiện.');
    }

    // update state in chunks to processing
    this.pdfChunks.update(cs => {
       const newCs = [...cs];
       newCs[chunkIndex] = { ...newCs[chunkIndex], status: 'processing', errorMessage: '' };
       return newCs;
    });

    const parts: any[] = [];
    
    // Read original PDF as base64
    const fileReader = new FileReader();
    const fileBase64Url = await new Promise<string>((resolve, reject) => {
      fileReader.onload = () => resolve(fileReader.result as string);
      fileReader.onerror = reject;
      fileReader.readAsDataURL(file);
    });
    const pdfBase64 = fileBase64Url.split(',')[1];
    
    let promptText = '';
    try {
      const response = await fetch('/prompts/reflow_instructions.md');
      if (!response.ok) throw new Error('Không thể tải tệp prompt từ server');
      promptText = await response.text();
    } catch (fetchErr) {
      console.warn('Lỗi fetch prompt template, sử dụng cấu hình mặc định:', fetchErr);
      promptText = `Bạn là một Chuyên gia Tiền xử lý Dữ liệu Ngôn ngữ (Language Data Pre-processing Expert) và Kỹ sư OCR tài liệu xuất sắc.
Nhiệm vụ của bạn là trích xuất văn bản từ tệp PDF đính kèm và chuyển đổi thành định dạng Markdown (MD) chuẩn xác nhất.

[MỤC ĐÍCH TỐI THƯỢNG]: Tệp Markdown này LÀ ĐẦU VÀO CHO HỆ THỐNG DỊCH THUẬT MÁY (Machine Translation) VÀ ĐÓNG GÓI SÁCH ĐIỆN TỬ (EPUB). Do đó, TÍNH LIỀN MẠCH CỦA NGỮ CẢNH (Contextual Continuity), ĐỘ SẠCH của văn bản và BẢO TOÀN VỊ TRÍ ẢNH là ưu tiên số một.

BẠN PHẢI TUÂN THỦ NGHIÊM NGẶT CÁC RÀNG BUỘC SAU:

1. NỐI MẠCH VĂN BẢN (QUAN TRỌNG NHẤT CHO DỊCH THUẬT):
- XÓA NGẮT DÒNG CỨNG (Hard Line Breaks): Bạn PHẢI tự động nối các câu/dòng thuộc cùng một đoạn văn (paragraph) thành một dải văn bản liên tục trên một dòng Markdown. Chuyển sang dòng mới (Enter) CHỈ KHI thực sự kết thúc một đoạn văn.
- NỐI CÂU QUA TRANG (Cross-page Merging): Nhận diện các câu bị cắt ngang giữa cuối trang trước và đầu trang sau. Nối chúng lại thành một câu hoàn chỉnh.
- NGOẠI LỆ: Các đoạn thơ/bài hát (thường có các dòng ngắn, thụt lề, lặp lại cấu trúc) thì PHẢI giữ nguyên ngắt dòng, chỉ nối các đoạn văn xuôi.
- GOM bố cục nhiều cột (Multi-column) thành MỘT cột: Nếu tài liệu có layout nhiều cột (báo chí, luận văn...), hãy đọc theo đúng luồng tự nhiên (hết cột trái mới sang phải, hoặc tùy ngữ cảnh) và gộp thành MỘT CỘT DUY NHẤT.

2. DỌN DẸP RÁC TÀI LIỆU (NOISE REMOVAL):
- Bỏ qua hoàn toàn: Header, Footer, Tên sách/Tên chương lặp lại ở lề trang, Số trang (Page numbers), Watermark.
- Sửa lỗi OCR dựa trên ngữ cảnh của câu.
- Chuẩn hóa dấu câu: Thống nhất dấu nháy kép thành \`"\` hoặc \`""\`; bảo toàn dấu gạch ngang dài (— em-dash).

3. BẢO TOÀN CẤU TRÚC VÀ ĐỊNH DẠNG:
- Tiêu đề: Phản ánh đúng cấu trúc phân cấp bằng H1, H2, H3 (#, ##, ###).
- Nhấn mạnh: Giữ lại in nghiêng (*italic*) và in đậm (**bold**) đối với từ khóa.
- Danh sách: Dùng \`-\` cho list không thứ tự, \`1.\` cho list có thứ tự.
- Bảng biểu (Tables): Dùng định dạng bảng Markdown (\`|---|---|\`). Nếu quá phức tạp, gom thành danh sách \`Key: Value\`.
- Trích dẫn: Dùng \`>\`.

4. XỬ LÝ CHÚ THÍCH (FOOTNOTES/ENDNOTES):
- Gom nội dung chú thích xuống cuối file Markdown theo định dạng: \`[^1]: Nội dung...\`. Không xen giữa các đoạn.

5. XỬ LÝ VÀ CHÈN HÌNH ẢNH, BIỂU ĐỒ TRỰC QUAN:
Chúng tôi đính kèm danh sách các hình ảnh thực tế bóc tách được (mang nhãn như \`![IMG-01]\`, \`![IMG-02]\`). 
- Quan sát tệp PDF đính kèm, nhận diện vị trí xuất hiện của chúng và sau đó CHÈN CHÍNH XÁC thẻ Markdown hình ảnh (VD: \`![IMG-01]\`) vào ĐÚNG vị trí tương ứng trong luồng văn bản (ngay sau hoặc trước đoạn mà hình ảnh minh họa đính kèm)
- Bạn tuyệt đối KHÔNG ĐƯỢC lược bỏ bất kỳ ảnh nào được truyền vào, hãy sử dụng và sắp xếp tên ảnh đúng theo đối chiếu của bạn ở tài liệu gốc.
- KHÔNG thay đổi nguyên mẫu nhãn \`![IMG-XX]\` (đừng dịch, đừng thêm Alt text, hãy giữ đúng chuỗi \`![IMG-01]\`) để hệ thống phần mềm phía sau ánh xạ chính xác file ảnh thật.

6. ĐẦU RA ZERO-FLUFF (CHỈ CODE):
- KHÔNG có bất kỳ lời chào hỏi, dạo đầu hay xin lỗi nào.
- KHÔNG bọc đầu ra trong khối \`\`\`markdown, mà bắt đầu trả về chuỗi Markdown ngay lập tức.`;
    }
    
    promptText += `\n\nCHÚ Ý ĐẶC BIỆT: \nCHỈ TRÍCH XUẤT VÀ XỬ LÝ NỘI DUNG TỪ PHẠM VI TRANG **${chunk.startPageNum}** ĐẾN TRANG **${chunk.endPageNum}** CỦA TÀI LIỆU PDF ĐÍNH KÈM VÀ BỎ QUA HOÀN TOÀN CÁC TRANG KHÁC.\n\nNhiệm vụ của bạn là đọc kĩ tệp PDF đính kèm cùng các hình ảnh, sau đó chuyển đổi thành mã Markdown. ĐẦU RA CHỈ ĐƯỢC PHÉP CHỨA ĐOẠN MÃ MARKDOWN NÀY, không viết lời giới thiệu. Bắt đầu mã Markdown ngay dưới đây:`;

    // 1. Send the original PDF document
    parts.push({
      inlineData: {
        mimeType: 'application/pdf',
        data: pdfBase64
      }
    });

    // 2. Core text prompt part
    parts.push({ text: promptText });

    // 3. Multimodal image structures containing actual base64 payloads to let AI recognize visual contents
    chunk.pages.forEach(page => {
      if (page.extractedImages) {
        page.extractedImages.forEach(img => {
          const rawBase64 = img.dataUrl.split(',')[1];
          parts.push({
            text: `\nDưới đây là dữ liệu hình ảnh bóc được mang nhãn [${img.labeledKey}]:\n`
          });
          parts.push({
            inlineData: {
              mimeType: 'image/png',
              data: rawBase64
            }
          });
        });
      }
    });

    // Use selected model dynamically (gemini-flash-latest or gemini-flash-lite-latest)
    const modelName = this.selectedModel();
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

    // Parse output Markdown to HTML preview
    const renderedHtml = this.pdfProcessor.renderMarkdownToHtml(rawMarkdown, chunk.pages);
    
    this.pdfChunks.update(cs => {
      const newCs = [...cs];
      newCs[chunkIndex] = { 
        ...newCs[chunkIndex], 
        status: 'completed', 
        markdownContent: rawMarkdown,
        reflowHtml: renderedHtml
      };
      return newCs;
    });
  }

  /**
   * Optimize page text flow through Client-Side Gemini REST API
   */
  async optimizeChunkWithAI(chunkIndex: number) {
    const file = this.pdfFile();
    const chunks = this.pdfChunks();
    const chunk = chunks[chunkIndex];

    if (!file || !chunk) {
      this.apiError.set('Không tìm thấy file nguồn hoặc phần phân chia.');
      return;
    }

    const apiKey = this.clientApiKey().trim();
    if (!apiKey) {
      this.apiError.set('Vui lòng điền Gemini API Key của bạn ở mục *Nhập API Key* nằm ở phía trên bên phải.');
      return;
    }

    this.selectedChunkIndex.set(chunkIndex); // Update view to current processing chunk

    this.isOptimizing.set(true);
    this.apiError.set('');
    this.showSuccess('');
    this.optimizationTimer.set(0);
    this.timerInterval = setInterval(() => {
      this.optimizationTimer.update(v => v + 1);
    }, 1000);

    try {
      await this.executeChunkOptimization(chunkIndex);
      this.selectedTab.set('reflow');
      this.showSuccess(`Đã ráp nối thành công dữ liệu cho ${chunk.id}.`);
    } catch (err: any) {
      console.error(err);
      this.apiError.set(err.message || 'Lỗi gửi yêu cầu AI trực tiếp. Xin kiểm tra lại tính chính xác của khóa API Key!');
      this.pdfChunks.update(cs => {
        const newCs = [...cs];
        newCs[chunkIndex] = { 
          ...newCs[chunkIndex], 
          status: 'error', 
          errorMessage: err.message || 'Lỗi xử lý'
        };
        return newCs;
      });
    } finally {
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
      this.isOptimizing.set(false);
    }
  }

  /**
   * Process all pending or error chunks in batches of 2 in parallel
   */
  async startBatchProcessing() {
    const file = this.pdfFile();
    if (!file) {
      this.apiError.set('Vui lòng chọn hoặc kéo thả tài liệu trước khi xử lý.');
      return;
    }

    const apiKey = this.clientApiKey().trim();
    if (!apiKey) {
      this.apiError.set('Vui lòng điền Gemini API Key của bạn ở mục *Nhập API Key* nằm ở phía trên bên phải.');
      return;
    }

    const chunks = this.pdfChunks();
    const pendingIndices = chunks
      .map((c, idx) => ({ status: c.status, idx }))
      .filter(item => item.status !== 'completed')
      .map(item => item.idx);

    if (pendingIndices.length === 0) {
      this.showSuccess('Tất cả các khối đã hoàn thành xử lý!');
      return;
    }

    this.isBatchProcessing.set(true);
    this.shouldStopBatch.set(false);
    this.isOptimizing.set(true);
    this.apiError.set('');
    this.showSuccess('');

    // Setup global timer for batch
    if (!this.timerInterval) {
      this.optimizationTimer.set(0);
      this.timerInterval = setInterval(() => {
        this.optimizationTimer.update(v => v + 1);
      }, 1000);
    }

    try {
      for (let i = 0; i < pendingIndices.length; i += 2) {
        if (this.shouldStopBatch()) {
          this.showSuccess('Đã nhận lệnh dừng. Các khối còn lại tạm dừng.');
          break;
        }

        const batch = pendingIndices.slice(i, i + 2);
        // Process this batch of up to 2 items in parallel
        await Promise.all(batch.map(idx => this.processSingleChunkForBatch(idx)));
      }
      
      const updatedChunks = this.pdfChunks();
      const allDoneNow = updatedChunks.every(c => c.status === 'completed');
      if (allDoneNow && !this.shouldStopBatch()) {
        this.showSuccess('Hoàn thành xử lý tất cả các phần thành công!');
        this.selectedTab.set('reflow');
      }
    } catch (err: any) {
      console.error(err);
      this.apiError.set('Có lỗi xảy ra trong quá trình xử lý hàng loạt: ' + (err.message || err));
    } finally {
      this.isBatchProcessing.set(false);
      this.isOptimizing.set(false);
      if (this.timerInterval) {
        clearInterval(this.timerInterval);
        this.timerInterval = null;
      }
    }
  }

  /**
   * Request to stop batch processing after early finish of active batch
   */
  stopBatchProcessing() {
    if (this.isBatchProcessing()) {
      this.shouldStopBatch.set(true);
      this.showSuccess('Đang yêu cầu dừng lại... Vui lòng chờ các phần đang chạy nốt.');
    }
  }

  private async processSingleChunkForBatch(chunkIndex: number): Promise<void> {
    try {
      // Pre-select current processing item for visibility
      this.selectedChunkIndex.set(chunkIndex);
      await this.executeChunkOptimization(chunkIndex);
    } catch (err: any) {
      console.error(err);
      this.pdfChunks.update(cs => {
        const newCs = [...cs];
        newCs[chunkIndex] = { 
          ...newCs[chunkIndex], 
          status: 'error', 
          errorMessage: err.message || 'Lỗi xử lý'
        };
        return newCs;
      });
    }
  }

  /**
   * Triggers download of strict EPUB zip standard package
   */
  async downloadEpubFile() {
    const chunks = this.pdfChunks();
    const isAllCompleted = chunks.length > 0 && chunks.every(c => c.status === 'completed');
    if (!isAllCompleted) {
      this.apiError.set('Vui lòng hoàn thành xử lý AI trên tất cả các khối trước khi tải file EPUB tổng.');
      return;
    }

    const activeMarkdown = chunks.map(c => c.markdownContent).join('\n\n');
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
    const chunks = this.pdfChunks();
    const isAllCompleted = chunks.length > 0 && chunks.every(c => c.status === 'completed');
    if (!isAllCompleted) {
      this.apiError.set('Vui lòng hoàn thành xử lý AI trên tất cả các khối trước.');
      return;
    }
    const activeMarkdown = chunks.map(c => c.markdownContent).join('\n\n');
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
    const chunks = this.pdfChunks();
    const isAllCompleted = chunks.length > 0 && chunks.every(c => c.status === 'completed');
    if (!isAllCompleted) {
      this.apiError.set('Vui lòng hoàn thành xử lý AI trên tất cả các khối trước.');
      return;
    }
    const activeHtml = chunks.map(c => c.reflowHtml).join('<hr class="my-8 border-slate-200" />');
    
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
    this.showSuccess('Đã tải trang HTML thành công.');
  }
}
