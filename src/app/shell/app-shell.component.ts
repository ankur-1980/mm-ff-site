import { Component, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { APP_NAV_LINKS } from '../shared/constants/nav-links';

@Component({
  selector: 'app-shell',
  imports: [
    MatSidenavModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet,
  ],
  templateUrl: './app-shell.component.html',
  styleUrl: './app-shell.component.scss',
})
export class AppShellComponent {
  readonly navLinks = APP_NAV_LINKS;
  private readonly drawer = viewChild.required(MatSidenav);

  toggleDrawer(): void {
    this.drawer().toggle();
  }

  closeDrawerAfterNav(): void {
    this.drawer().close();
  }
}
