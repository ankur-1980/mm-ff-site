import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-hamburger-menu',
  imports: [],
  templateUrl: './app-hamburger-menu.html',
  styleUrl: './app-hamburger-menu.scss',
})
export class AppHamburgerMenu {
  readonly ariaLabel = input<string>('Open menu');
  readonly menuRequested = output<void>();

  requestMenu(): void {
    this.menuRequested.emit();
  }
}
