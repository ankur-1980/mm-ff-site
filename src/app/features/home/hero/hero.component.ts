import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-hero',
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
  imports: [MatIconModule]
})
export class HeroComponent {
  /** Id of the element to scroll to when the chevron is clicked. */
  scrollTargetId = input<string>('home-content');

  scrollToContent(): void {
    const id = this.scrollTargetId();
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
