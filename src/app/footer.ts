import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  selector: 'app-footer',
  imports: [CommonModule],
  template: `
    <footer class="border-t border-white/5 bg-slate-950/60 py-3.5 px-6 shrink-0 z-10 w-full">
      <div class="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-sans w-full cursor-default">
        
        <!-- Left side: Placeholder -->
        <div class="flex items-center justify-center sm:justify-start w-full sm:flex-1 shrink-0">
        </div>

        <!-- Center side: Links -->
        <div class="flex flex-wrap justify-center items-center gap-2.5 sm:gap-4 shrink-0 text-slate-400 font-normal">
          <span class="text-slate-400">v1.0.25</span>
          <span class="text-slate-800 font-light text-xs select-none">•</span>
          <a href="https://github.com/kiencang/pdf-2-epub-docx" target="_blank" rel="noopener noreferrer" class="hover:text-white transition-colors duration-200 cursor-pointer">GitHub</a>
          <span class="text-slate-800 font-light text-xs select-none">•</span>
          <span class="text-slate-200 font-semibold">Nguyễn Đức Anh</span>
          <span class="text-slate-800 font-light text-xs select-none">•</span>
          <a href="mailto:contact@wpsila.com" class="hover:text-white transition-colors duration-200 font-mono cursor-pointer">contact@wpsila.com</a>
          <span class="text-slate-800 font-light text-xs select-none">•</span>
          <button type="button" (click)="openInstruction.emit()" class="text-indigo-400 hover:text-indigo-300 font-medium transition-colors duration-200 cursor-pointer focus:outline-none">
            Hướng dẫn sử dụng
          </button>
        </div>

        <!-- Right side: Dev mode toggle -->
        <div class="flex items-center justify-center sm:justify-end gap-2 relative group w-full sm:flex-1 shrink-0">
          @if (hasPages()) {
            <span class="text-slate-400 font-medium select-none">Dev</span>
            <button type="button" 
                    (click)="toggleDevMode.emit()" 
                    [disabled]="isOptimizing() || isParsing()"
                    class="relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                    [class.bg-indigo-500]="isDevMode()"
                    [class.bg-slate-700]="!isDevMode()">
              <span class="pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out"
                    [class.translate-x-3]="isDevMode()"
                    [class.translate-x-0]="!isDevMode()"></span>
            </button>
            <!-- Tooltip -->
            <div class="absolute bottom-full left-1/2 -translate-x-1/2 sm:translate-x-0 sm:right-0 sm:left-auto mb-3 hidden w-[250px] group-hover:block bg-slate-800 text-slate-100 text-[11px] px-3 py-2 rounded-lg shadow-xl border border-white/10 z-[100] text-center sm:text-left pointer-events-none">
              Chỉ dành cho lập trình viên, bật để quan sát file markdown và file HTML.
              <div class="absolute -bottom-1 left-1/2 -translate-x-1/2 sm:translate-x-0 sm:right-2 sm:left-auto w-2 h-2 bg-slate-800 border-b border-r border-white/10 transform rotate-45"></div>
            </div>
          }
        </div>
        
      </div>
    </footer>
  `
})
export class Footer {
  isDevMode = input.required<boolean>();
  hasPages = input.required<boolean>();
  isOptimizing = input.required<boolean>();
  isParsing = input.required<boolean>();

  toggleDevMode = output<void>();
  openInstruction = output<void>();
}
