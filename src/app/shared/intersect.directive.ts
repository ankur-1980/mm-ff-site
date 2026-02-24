import { Directive, ElementRef, OnDestroy, OnInit, inject, output } from '@angular/core';

@Directive({
  selector: '[appIntersect]',
  standalone: true,
})
export class IntersectDirective implements OnInit, OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private lastIntersecting?: boolean;
  private scrollTarget: Window | Element | null = null;
  private readonly onScrollOrResize = () => {
    this.emitVisibility();
  };

  readonly intersect = output<boolean>();

  ngOnInit(): void {
    this.scrollTarget = this.getScrollParent(this.elementRef.nativeElement);
    if (this.scrollTarget) {
      this.scrollTarget.addEventListener('scroll', this.onScrollOrResize, { passive: true });
    }
    window.addEventListener('scroll', this.onScrollOrResize, { passive: true });
    window.addEventListener('resize', this.onScrollOrResize, { passive: true });
    this.emitVisibility();
  }

  ngOnDestroy(): void {
    if (this.scrollTarget) {
      this.scrollTarget.removeEventListener('scroll', this.onScrollOrResize);
    }
    window.removeEventListener('scroll', this.onScrollOrResize);
    window.removeEventListener('resize', this.onScrollOrResize);
  }

  /** First scrollable ancestor, or null to rely on window only. */
  private getScrollParent(el: HTMLElement): Element | null {
    let parent = el.parentElement;
    while (parent) {
      const { overflowY } = getComputedStyle(parent);
      const scrollable = /auto|scroll|overlay/.test(overflowY) && parent.scrollHeight > parent.clientHeight;
      if (scrollable) return parent;
      parent = parent.parentElement;
    }
    return null;
  }

  private emitVisibility(): void {
    const heroBottom = this.elementRef.nativeElement.getBoundingClientRect().bottom;
    const toolbarHeight = this.getToolbarHeightPx();
    const isIntersecting = Math.ceil(heroBottom) > toolbarHeight;

    if (isIntersecting === this.lastIntersecting) {
      return;
    }

    this.lastIntersecting = isIntersecting;
    this.intersect.emit(isIntersecting);
  }

  private getToolbarHeightPx(): number {
    const value = getComputedStyle(document.documentElement)
      .getPropertyValue('--app-toolbar-height')
      .trim();
    const parsed = Number.parseFloat(value);

    return Number.isFinite(parsed) ? parsed : 56;
  }
}
