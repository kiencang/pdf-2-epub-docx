import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { PdfChunk } from './app';
import { SafeHtml } from '@angular/platform-browser';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-workspace-preview',
  imports: [CommonModule, MatIconModule],
  host: {
    'class': 'flex-1 flex flex-col min-h-0 bg-slate-950 w-full overflow-hidden'
  },
  template: `
      
      <!-- Top Tab Switch Layout -->
      <div class="border-b border-white/5 bg-slate-950 px-6 py-2 flex items-center justify-between shrink-0 flex-wrap gap-2">
        <div class="flex gap-2 flex-wrap">
          <button 
            (click)="tabChange.emit('pdf')"
            class="px-4 py-2.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 font-sans cursor-pointer"
            [class.bg-white/10]="selectedTab() === 'pdf'"
            [class.text-white]="selectedTab() === 'pdf'"
            [class.font-bold]="selectedTab() === 'pdf'"
            [class.text-slate-400]="selectedTab() !== 'pdf'"
            [class.hover:text-slate-200]="selectedTab() !== 'pdf'">
            <mat-icon class="text-xs">collections</mat-icon>
            Ảnh & Bản gốc
          </button>
          
          @if (reflowHtml()) {
            <button 
              (click)="tabChange.emit('reflow')"
              class="px-4 py-2.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 font-sans cursor-pointer"
              [class.bg-white/10]="selectedTab() === 'reflow'"
              [class.text-white]="selectedTab() === 'reflow'"
              [class.font-bold]="selectedTab() === 'reflow'"
              [class.text-slate-400]="selectedTab() !== 'reflow'"
              [class.hover:text-slate-200]="selectedTab() !== 'reflow'">
              <mat-icon class="text-xs">chrome_reader_mode</mat-icon>
              Xem trước
            </button>
            @if (isDevMode()) {
              <button 
                (click)="tabChange.emit('markdown')"
                class="px-4 py-2.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 font-sans cursor-pointer"
                [class.bg-white/10]="selectedTab() === 'markdown'"
                [class.text-white]="selectedTab() === 'markdown'"
                [class.font-bold]="selectedTab() === 'markdown'"
                [class.text-slate-400]="selectedTab() !== 'markdown'"
                [class.hover:text-slate-200]="selectedTab() !== 'markdown'">
                <mat-icon class="text-xs">text_snippet</mat-icon>
                Markdown
              </button>
              <button 
                (click)="tabChange.emit('source')"
                class="px-4 py-2.5 text-xs font-semibold rounded-lg transition flex items-center gap-1.5 font-sans cursor-pointer"
                [class.bg-white/10]="selectedTab() === 'source'"
                [class.text-white]="selectedTab() === 'source'"
                [class.font-bold]="selectedTab() === 'source'"
                [class.text-slate-400]="selectedTab() !== 'source'"
                [class.hover:text-slate-200]="selectedTab() !== 'source'">
                <mat-icon class="text-xs">code</mat-icon>
                HTML
              </button>
            }
          }
        </div>

        <!-- Action Bar: Export EPUB and Word -->
        <div class="flex items-center gap-2 text-xs font-sans">
          @if (reflowHtml()) {
            <button 
              (click)="downloadDocx.emit()"
              [disabled]="isParsing() || isOptimizing()"
              title="Tải tài liệu Microsoft Word (.docx)"
              class="py-2.5 px-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition shadow shadow-indigo-500/10 cursor-pointer focus:outline-none disabled:cursor-not-allowed shrink-0">
              <mat-icon class="text-[18px] w-[18px] h-[18px] leading-[18px] flex items-center justify-center">description</mat-icon>
              <span>Tài liệu Docx</span>
            </button>
            <button 
              (click)="downloadEpub.emit()"
              [disabled]="isParsing() || isOptimizing()"
              title="Tải sách điện tử định dạng EPUB 3"
              class="py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:bg-slate-800 disabled:text-slate-500 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition shadow shadow-emerald-500/10 cursor-pointer focus:outline-none disabled:cursor-not-allowed shrink-0">
              <mat-icon class="text-[18px] w-[18px] h-[18px] leading-[18px] flex items-center justify-center">book</mat-icon>
              <span>Sách EPUB</span>
            </button>
          }
        </div>
      </div>

      <!-- Preview Content Canvas Window -->
      <div class="flex-grow overflow-y-auto p-4 md:p-8 flex justify-center">
        
        <!-- Reflow modern article Tab container -->
        @if (selectedTab() === 'reflow') {
          <div 
            class="w-full max-w-4xl rounded-2xl shadow-lg border p-6 md:p-14 transition-all duration-300 relative"
            [class.bg-white]="themeStyle() === 'clean'"
            [class.text-slate-800]="themeStyle() === 'clean'"
            [class.border-slate-200]="themeStyle() === 'clean'"
            [class.bg-[#fbf6ec]]="themeStyle() === 'warm'"
            [class.text-slate-850]="themeStyle() === 'warm'"
            [class.border-amber-100]="themeStyle() === 'warm'"
            [class.bg-zinc-950]="themeStyle() === 'mono'"
            [class.text-zinc-200]="themeStyle() === 'mono'"
            [class.border-zinc-900]="themeStyle() === 'mono'"
            [class.font-mono]="themeStyle() === 'mono'">
            
            @if (reflowHtml()) {
              <!-- Render optimized AI output -->
              <div class="prose max-w-none text-justify flex flex-col" [innerHTML]="reflowSafeHtml()"></div>
            }

          </div>
        }

        <!-- Markdown Source Code Viewer -->
        @if (selectedTab() === 'markdown') {
          <div class="w-full max-w-4xl h-full flex flex-col bg-slate-950" id="markdown-source-preview">
            <div class="flex flex-col justify-center items-center h-full shrink-0 bg-slate-900/50 p-6 border border-white/5 rounded-2xl font-sans gap-4 flex-grow">
              <mat-icon class="text-slate-500 text-[48px] !h-12 !w-12 mb-2 leading-none">markdown</mat-icon>
              <p class="text-sm text-slate-400 text-center max-w-md">Mã Markdown đã được bóc tách và tạo thành công. Bạn có thể tải file Markdown về máy.</p>
              <button 
                (click)="downloadMarkdown.emit()" 
                class="px-6 py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-500/20 cursor-pointer">
                <mat-icon class="text-[18px] !h-[18px] !w-[18px] leading-none flex items-center justify-center -mt-[1px]">download</mat-icon>
                Tải về .md
              </button>
            </div>
          </div>
        }

        <!-- Canvas View (Original exact PDF page renders) -->
        @if (selectedTab() === 'pdf') {
          <div class="w-full max-w-3xl flex flex-col gap-4" id="pdf-scroller-layout">
            <div class="text-center py-3 text-xs text-slate-400 uppercase font-mono tracking-widest block bg-slate-900 border border-white/5 rounded-2xl font-sans shrink-0">
              Ảnh trích xuất từ tài liệu gốc (Bấm vào từng ảnh bên dưới để coi chi tiết)
            </div>
            
            <!-- Bounded height scrollable container with customized scrollbar styling -->
            <div class="max-h-[62vh] overflow-y-auto pr-3 flex flex-col gap-5">
              <!-- Page renders -->
              @for (page of (activeChunk()?.pages || []); track page.pageNum) {
                <div class="border border-white/10 rounded-2xl overflow-hidden bg-slate-950 shadow-md p-4 space-y-4 shrink-0">
                  <div class="text-xs font-mono text-slate-400 flex justify-between">
                    <span class="font-bold">Trang số {{ page.pageNum }}</span>
                    <span>Số ảnh riêng lẻ tách được: {{ page.extractedImages.length || 0 }} ảnh</span>
                  </div>
                  
                  <div class="border border-white/5 rounded-xl overflow-hidden max-w-2xl mx-auto">
                    <img [src]="page.pageImageUrl" alt="Trang {{ page.pageNum }}" class="w-full h-auto object-contain" referrerpolicy="no-referrer" />
                  </div>

                  @if (page.extractedImages && page.extractedImages.length > 0) {
                    <div class="border-t border-white/5 pt-4">
                      <span class="text-[11px] text-slate-400 font-semibold block mb-2 font-sans">Các ảnh lẻ từ trang này:</span>
                      <div class="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        @for (img of page.extractedImages; track img.labeledKey) {
                          <div class="bg-slate-900 border border-white/5 p-2 rounded-xl flex flex-col items-center">
                            <button type="button" (click)="zoomImage.emit(img.dataUrl)" class="cursor-zoom-in focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg p-1" title="Nhấp để phóng to ảnh">
                              <img [src]="img.dataUrl" alt="{{ img.labeledKey }}" class="h-20 object-contain" referrerpolicy="no-referrer" />
                            </button>
                            <span class="text-[10px] font-bold text-indigo-400 mt-2 font-mono">{{ img.labeledKey }}</span>
                            <span class="text-[8px] text-slate-500 font-mono">{{ img.width }}x{{ img.height }}px</span>
                          </div>
                        }
                      </div>
                    </div>
                  } @else {
                    <span class="text-[10px] text-slate-600 block text-center italic font-sans">Trang này không có tệp tin ảnh rời rạc</span>
                  }

                </div>
              }
            </div>
          </div>
        }

        <!-- Source HTML code view -->
        @if (selectedTab() === 'source') {
          <div class="w-full max-w-4xl h-full flex flex-col bg-slate-950" id="html-source-preview">
            <div class="flex flex-col justify-center items-center h-full shrink-0 bg-slate-900/50 p-6 border border-white/5 rounded-2xl font-sans gap-4 flex-grow">
              <mat-icon class="text-slate-500 text-[48px] !h-12 !w-12 mb-2 leading-none">html</mat-icon>
              <p class="text-sm text-slate-400 text-center max-w-md">Mã HTML đã được bóc tách và tạo thành công. Bạn có thể tải file HTML về máy.</p>
              <button 
                (click)="downloadHtml.emit()" 
                class="px-6 py-3 mt-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm font-bold flex items-center gap-2 transition shadow-lg shadow-indigo-500/20 cursor-pointer">
                <mat-icon class="text-[18px] !h-[18px] !w-[18px] leading-none flex items-center justify-center -mt-[1px]">download</mat-icon>
                Tải về .html
              </button>
            </div>
          </div>
        }

      </div>
  `
})
export class WorkspacePreview {
  selectedTab = input.required<'reflow' | 'pdf' | 'source' | 'markdown'>();
  themeStyle = input.required<'clean' | 'warm' | 'mono'>();
  reflowHtml = input.required<string>();
  reflowSafeHtml = input.required<SafeHtml>();
  isDevMode = input.required<boolean>();
  isParsing = input.required<boolean>();
  isOptimizing = input.required<boolean>();
  activeChunk = input.required<PdfChunk | null>();

  tabChange = output<'reflow' | 'pdf' | 'source' | 'markdown'>();
  themeStyleChange = output<'clean' | 'warm' | 'mono'>();
  downloadEpub = output<void>();
  downloadDocx = output<void>();
  downloadMarkdown = output<void>();
  downloadHtml = output<void>();
  zoomImage = output<string>();
}
