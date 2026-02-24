import { Directive, ElementRef, OnDestroy, OnInit, inject, output } from '@angular/core';

/**
 * Uses the browser's IntersectionObserver API to emit when the host element
 * enters or leaves the viewport (below the toolbar). More performant than
 * scroll listeners and matches the "intersect" name.
 */
@Directive({
  selector: '[appIntersect]',
})
export class IntersectDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private lastIntersecting: boolean | undefined;
  private observer: IntersectionObserver | null = null;
  private readonly onResize = (): void => this.connectObserver();

  readonly intersect = output<boolean>();

  ngOnInit(): void {
    this.connectObserver();
    window.addEventListener('resize', this.onResize);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.onResize);
    this.observer?.disconnect();
  }

  private connectObserver(): void {
    this.observer?.disconnect();
    const topPx = Math.round(this.getToolbarHeightPx());
    const rootMargin = `${-topPx}px 0px 0px 0px`;
    this.observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry || entry.isIntersecting === this.lastIntersecting) return;
        this.lastIntersecting = entry.isIntersecting;
        this.intersect.emit(entry.isIntersecting);
      },
      {
        root: null,
        rootMargin,
        threshold: 0,
      }
    );
    this.observer.observe(this.elementRef.nativeElement);
    // Emit initial state (observer fires asynchronously)
    const rect = this.elementRef.nativeElement.getBoundingClientRect();
    const intersecting = Math.ceil(rect.bottom) > topPx;
    if (this.lastIntersecting !== intersecting) {
      this.lastIntersecting = intersecting;
      this.intersect.emit(intersecting);
    }
  }

  private getToolbarHeightPx(): number {
    const toolbar = document.querySelector('mat-toolbar');
    const h = toolbar?.getBoundingClientRect().height;
    if (typeof h === 'number' && Number.isFinite(h) && h > 0) return h;
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue('--app-toolbar-height')
      .trim();
    const parsed = Number.parseFloat(value);
    const fallback = 56;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
  }
}
