import { Component, input, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { IntersectDirective } from '../../../shared/intersect.directive';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  imports: [MatIconModule, IntersectDirective],
  host: { '[class.hero--hidden]': '!isVisible()' }
})
export class HeroComponent {
  /** Id of the element to scroll to when the chevron is clicked. */
  scrollTargetId = input<string>('home-content');

  protected readonly isVisible = signal(true);

  scrollToContent(): void {
    const id = this.scrollTargetId();
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
