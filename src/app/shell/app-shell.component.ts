import { Component, viewChild } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatButtonModule } from '@angular/material/button';
import { APP_NAV_LINKS } from '../shared/constants/nav-links';
import { AppNavBar } from '../shared/components/app-nav-bar/app-nav-bar';

@Component({
  selector: 'app-shell',
  imports: [
    AppNavBar,
    MatSidenavModule,
    MatButtonModule,
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
