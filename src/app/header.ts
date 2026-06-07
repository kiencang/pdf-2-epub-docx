import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';

export type ModelType = 'gemini-flash-latest' | 'gemini-flash-lite-latest' | 'gemma-4-26b-a4b-it';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-header',
  imports: [CommonModule, MatIconModule],
  template: `
    <header class="border-b border-white/5 bg-slate-950/80 backdrop-blur sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
      <div class="flex items-center gap-3">
        <img src="favicon.svg" alt="Logo" class="h-10 w-10 object-contain hover:scale-105 transition-transform duration-200 select-none cursor-pointer" referrerpolicy="no-referrer" />
        <div>
          <h1 class="text-lg font-bold tracking-tight font-sans bg-gradient-to-r from-white via-slate-100 to-slate-300 bg-clip-text text-transparent">PDF-2-EPUB-DOCX</h1>
        </div>
 
        <!-- Cool 3-Model Switch Toggle -->
        <div class="flex items-center bg-slate-900/90 border border-white/5 rounded-full p-0.5 ml-2.5 shadow-inner relative select-none shrink-0 transition-opacity duration-200 w-[220px]"
             [class.opacity-50]="isOptimizing() || isParsing()"
             [class.pointer-events-none]="isOptimizing() || isParsing()"
             id="model-toggle-wrapper">
          <!-- Active indicator pill background with high-quality cubic-bezier transition -->
          <div 
            class="absolute top-0.5 bottom-0.5 rounded-full border transition-all duration-300 pointer-events-none overflow-hidden"
            [class.bg-amber-500/10]="selectedModel() === 'gemini-flash-latest'"
            [class.border-amber-500/30]="selectedModel() === 'gemini-flash-latest'"
            [class.shadow-[0_0_14px_rgba(245,158,11,0.25)]]="selectedModel() === 'gemini-flash-latest'"
            [class.bg-indigo-500/10]="selectedModel() === 'gemini-flash-lite-latest'"
            [class.border-indigo-500/30]="selectedModel() === 'gemini-flash-lite-latest'"
            [class.shadow-[0_0_14px_rgba(99,102,241,0.25)]]="selectedModel() === 'gemini-flash-lite-latest'"
            [class.bg-emerald-500/10]="selectedModel() === 'gemma-4-26b-a4b-it'"
            [class.border-emerald-500/30]="selectedModel() === 'gemma-4-26b-a4b-it'"
            [class.shadow-[0_0_14px_rgba(16,185,129,0.25)]]="selectedModel() === 'gemma-4-26b-a4b-it'"
            style="width: 72px;"
            [style.left.px]="selectedModel() === 'gemini-flash-latest' ? 2 : (selectedModel() === 'gemini-flash-lite-latest' ? 74 : 146)">
            <!-- Subtly soft glow diffusers inside the pill -->
            <div class="absolute inset-0 opacity-20 blur-md rounded-full transition-colors duration-300"
                 [class.bg-amber-400]="selectedModel() === 'gemini-flash-latest'"
                 [class.bg-indigo-400]="selectedModel() === 'gemini-flash-lite-latest'"
                 [class.bg-emerald-400]="selectedModel() === 'gemma-4-26b-a4b-it'">
            </div>
          </div>
 
          <!-- Option 1: Flash -->
          <button 
            id="toggle-btn-flash"
            type="button"
            (click)="onModelSelect('gemini-flash-latest')"
            [disabled]="isOptimizing() || isParsing()"
            class="relative w-[72px] h-7 rounded-full flex items-center justify-center gap-1 text-[11px] font-bold font-sans transition-all duration-200 outline-none cursor-pointer group disabled:cursor-not-allowed"
            [class.text-amber-400]="selectedModel() === 'gemini-flash-latest'"
            [class.text-slate-400]="selectedModel() !== 'gemini-flash-latest'"
            [class.hover:text-slate-200]="selectedModel() !== 'gemini-flash-latest'">
            <mat-icon class="!text-[13px] !w-3.5 !h-3.5 leading-none flex items-center justify-center group-hover:scale-110 transition-transform" [class.text-amber-400]="selectedModel() === 'gemini-flash-latest'">bolt</mat-icon>
            <span>Flash</span>
            
            <!-- Tailwind Tooltip -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-slate-950 border border-white/10 text-slate-200 text-[10px] font-normal rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-200 shadow-xl whitespace-nowrap z-50 pointer-events-none">
              <span class="font-bold text-amber-400">Flash:</span> Model này thích hợp để xử lý tài liệu có cấu trúc phức tạp.
            </div>
          </button>
 
          <!-- Option 2: Lite -->
          <button 
            id="toggle-btn-lite"
            type="button"
            (click)="onModelSelect('gemini-flash-lite-latest')"
            [disabled]="isOptimizing() || isParsing()"
            class="relative w-[72px] h-7 rounded-full flex items-center justify-center gap-1 text-[11px] font-bold font-sans transition-all duration-200 outline-none cursor-pointer group disabled:cursor-not-allowed"
            [class.text-indigo-400]="selectedModel() === 'gemini-flash-lite-latest'"
            [class.text-slate-400]="selectedModel() !== 'gemini-flash-lite-latest'"
            [class.hover:text-slate-200]="selectedModel() !== 'gemini-flash-lite-latest'">
            <mat-icon class="!text-[13px] !w-3.5 !h-3.5 leading-none flex items-center justify-center group-hover:scale-110 transition-transform" [class.text-indigo-400]="selectedModel() === 'gemini-flash-lite-latest'">spa</mat-icon>
            <span>Lite</span>
 
            <!-- Tailwind Tooltip -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-slate-950 border border-white/10 text-slate-200 text-[10px] font-normal rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-205 shadow-xl whitespace-nowrap z-50 pointer-events-none">
              <span class="font-bold text-indigo-400">Lite (mặc định):</span> Model có khả năng xử lý đủ tốt trong đa số trường hợp.
            </div>
          </button>

          <!-- Option 3: Gemma -->
          <button 
            id="toggle-btn-gemma"
            type="button"
            (click)="onModelSelect('gemma-4-26b-a4b-it')"
            [disabled]="isOptimizing() || isParsing()"
            class="relative w-[72px] h-7 rounded-full flex items-center justify-center gap-1 text-[11px] font-bold font-sans transition-all duration-200 outline-none cursor-pointer group disabled:cursor-not-allowed"
            [class.text-emerald-400]="selectedModel() === 'gemma-4-26b-a4b-it'"
            [class.text-slate-400]="selectedModel() !== 'gemma-4-26b-a4b-it'"
            [class.hover:text-slate-200]="selectedModel() !== 'gemma-4-26b-a4b-it'">
            <mat-icon class="!text-[13px] !w-3.5 !h-3.5 leading-none flex items-center justify-center group-hover:scale-110 transition-transform" [class.text-emerald-400]="selectedModel() === 'gemma-4-26b-a4b-it'">home</mat-icon>
            <span>Gemma</span>
 
            <!-- Tailwind Tooltip -->
            <div class="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2.5 py-1.5 bg-slate-950 border border-white/10 text-slate-200 text-[10px] font-normal rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition duration-205 shadow-xl w-[300px] whitespace-normal z-50 pointer-events-none text-center leading-normal">
              <span class="font-bold text-emerald-400">Gemma:</span> Model 'gemma-4-26b-a4b-it' mã nguồn mở.<br>Chỉ dùng để test, không có tốc độ tốt như Lite & Flash.
            </div>
          </button>
        </div>
      </div>

      <!-- Status Badge -->
      <div class="flex items-center gap-2 text-xs">
        @if (isScriptLoaded()) {
          <!-- Lịch sử chuyển đổi Button -->
          <button 
            type="button"
            (click)="openHistory.emit()"
            [disabled]="isOptimizing() || isParsing()"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-white/5 rounded-full font-medium transition-colors cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none">
            <mat-icon class="!text-[15px] !w-[15px] !h-[15px] leading-none flex items-center justify-center -mt-[1px]">history</mat-icon>
            <span>Lịch sử chuyển đổi</span>
            @if (historyCount() > 0) {
              <span class="bg-indigo-500 text-white text-[9px] min-w-[16px] h-4 flex items-center justify-center rounded-full font-semibold px-1 select-none leading-none">
                {{ historyCount() }}
              </span>
            }
          </button>

          <button 
            type="button"
            (click)="openApiKey.emit()"
            [disabled]="isOptimizing() || isParsing()"
            class="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-full font-medium transition-colors cursor-pointer focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed">
            <span class="h-1.5 w-1.5 bg-emerald-400 rounded-full" [class.animate-pulse]="!clientApiKey()"></span>
            {{ clientApiKey() ? 'Đang dùng Key của bạn' : 'Nhập API Key' }}
          </button>
        } @else {
          <span class="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-full font-medium">
            <span class="h-1.5 w-1.5 bg-amber-400 rounded-full animate-bounce"></span>
            Đang khởi tạo thư viện...
          </span>
        }
      </div>
    </header>
  `,
  styles: []
})
export class Header {
  isScriptLoaded = input.required<boolean>();
  selectedModel = input.required<ModelType>();
  clientApiKey = input.required<string>();
  historyCount = input.required<number>();
  isOptimizing = input.required<boolean>();
  isParsing = input.required<boolean>();

  modelChange = output<ModelType>();
  openHistory = output<void>();
  openApiKey = output<void>();

  onModelSelect(model: ModelType) {
    if (this.isOptimizing() || this.isParsing()) return;
    this.modelChange.emit(model);
  }
}
