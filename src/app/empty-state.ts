import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-empty-state',
  imports: [CommonModule, MatIconModule],
  host: {
    'class': 'flex-grow flex flex-col items-center justify-center w-full'
  },
  template: `
    <div class="flex-1 max-w-4xl mx-auto flex flex-col items-center justify-center px-6 py-12 text-center" id="empty-state">
      
      <!-- Drag or Select Card -->
      <div 
        role="button"
        tabindex="0"
        (dragover)="onDragOver($event)"
        (drop)="onFileDropped($event)"
        (click)="fileInput.click()"
        (keydown.enter)="fileInput.click()"
        class="w-full max-w-lg bg-slate-950 border-2 border-dashed border-white/10 hover:border-indigo-500/50 rounded-3xl p-10 md:p-14 transition-all duration-300 shadow-2xl flex flex-col items-center group cursor-pointer">
        
        <input 
          #fileInput 
          type="file" 
          accept="application/pdf" 
          (change)="onFileSelected($event)" 
          class="hidden" />

        <div class="h-28 w-28 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400 group-hover:scale-105 group-hover:bg-indigo-500/20 group-hover:text-indigo-300 transition-all duration-300 mb-4 border border-indigo-500/10">
          @if (isParsing()) {
            <mat-icon class="text-4xl w-9 h-9 text-[36px] leading-[36px] animate-spin">sync</mat-icon>
          } @else {
            <mat-icon class="w-16 h-16 text-[64px] leading-[64px]">cloud_upload</mat-icon>
          }
        </div>

        @if (!isParsing()) {
          <div class="text-[11px] font-sans font-medium text-slate-500 mb-6 text-center">
            [Tối đa: 50MB / 500 trang]
          </div>
        }

        @if (isParsing()) {
          <h2 class="text-sm font-semibold tracking-tight mb-2 font-sans text-slate-100 text-center leading-snug">
            Đang phân tích cú pháp dữ liệu...
          </h2>
        }
        <p class="text-sm text-slate-400 mb-6 max-w-sm font-sans text-center leading-relaxed">
          @if (isParsing()) {
            {{ parsingStatus() || 'Hệ thống đang cấu trúc thông tin' }}
          } @else {
            Ứng dụng sẽ tự động trích xuất hình ảnh, rồi chuyển tài liệu thành <strong>định dạng EPUB</strong> tiêu chuẩn.
          }
        </p>

        @if (!isParsing()) {
          <span class="px-8 py-3.5 flex items-center gap-2 text-base font-semibold bg-indigo-600 hover:bg-indigo-500 rounded-lg transition shadow-lg shadow-indigo-600/10 font-sans text-white">
            <mat-icon class="text-[20px] w-5 h-5 leading-[20px]">description</mat-icon>
            Chọn tệp tin PDF
          </span>
        } @else {
          <div class="w-full bg-slate-900 rounded-full h-1.5 max-w-xs mt-4 overflow-hidden border border-white/5">
            <div class="bg-indigo-500 h-1.5 rounded-full animate-pulse-width" style="width: 75%"></div>
          </div>
        }
      </div>

    </div>
  `
})
export class EmptyState {
  isParsing = input.required<boolean>();
  parsingStatus = input.required<string>();
  isScriptLoaded = input.required<boolean>();

  fileSelected = output<File>();

  onDragOver(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
  }

  onFileDropped(event: DragEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
        this.fileSelected.emit(file);
      }
    }
  }

  onFileSelected(event: Event) {
    const inputEl = event.target as HTMLInputElement;
    if (inputEl.files && inputEl.files.length > 0) {
      this.fileSelected.emit(inputEl.files[0]);
    }
  }
}
