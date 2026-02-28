import { Component, input, output } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

type AppNavLink = {
  route: string;
  label: string;
};

@Component({
  selector: 'app-nav-bar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './app-nav-bar.html',
  styleUrl: './app-nav-bar.scss',
})
export class AppNavBar {
  readonly links = input.required<readonly AppNavLink[]>();
  readonly brand = input<string>('Midwest Madness');
  readonly establishedLabel = input<string>('Since 2006');
  readonly menuRequested = output<void>();

  requestMenu(): void {
    this.menuRequested.emit();
  }
}
