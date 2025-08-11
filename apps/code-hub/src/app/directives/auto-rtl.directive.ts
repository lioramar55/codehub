import {
  Directive,
  ElementRef,
  HostListener,
  Input,
  Renderer2,
  inject,
} from '@angular/core';

@Directive({
  selector: '[appAutoRtl]',
  standalone: true,
})
export class AutoRtlDirective {
  private currentValue = '';

  @Input('appAutoRtl')
  set text(value: string | null | undefined) {
    this.currentValue = value ?? '';
    this.apply();
  }

  @Input()
  rtlWordsToCheck = 6;

  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly renderer = inject(Renderer2);

  @HostListener('input')
  onHostInput() {
    const nativeEl = this.el.nativeElement as HTMLInputElement | HTMLElement;
    const value = (nativeEl as HTMLInputElement).value ?? '';
    if (typeof value === 'string') {
      this.currentValue = value;
      this.apply();
    }
  }

  private isRtlByFirstWords(text: string, wordsToCheck: number): boolean {
    const trimmed = text.trim();
    if (!trimmed) return false;

    const words = trimmed.split(/\s+/u).slice(0, Math.max(1, wordsToCheck));
    if (words.length === 0) return false;

    const hebrewRegex = /[\u0590-\u05FF]/;
    const hebrewCount = words.reduce(
      (count, w) => count + (hebrewRegex.test(w) ? 1 : 0),
      0
    );
    return hebrewCount > words.length / 2;
  }

  private apply() {
    const isRtl = this.isRtlByFirstWords(
      this.currentValue,
      this.rtlWordsToCheck
    );
    if (isRtl) {
      this.renderer.setAttribute(this.el.nativeElement, 'dir', 'rtl');
      this.renderer.addClass(this.el.nativeElement, 'text-right');
    } else {
      this.renderer.removeAttribute(this.el.nativeElement, 'dir');
      this.renderer.removeClass(this.el.nativeElement, 'text-right');
    }
  }
}
