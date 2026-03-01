import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

type CtaButtonRoute = string | readonly string[];
type CtaButtonVariant = 'inline' | 'tile';

@Component({
  selector: 'app-cta-button',
  imports: [RouterLink, MatIconModule],
  templateUrl: './cta-button.html',
  styleUrl: './cta-button.scss',
})
export class CtaButton {
  readonly label = input.required<string>();
  readonly route = input<CtaButtonRoute | null>(null);
  readonly ariaLabel = input<string>('');
  readonly stretch = input<boolean>(false);
  readonly icon = input<string>('');
  readonly variant = input<CtaButtonVariant>('inline');
  readonly pressed = output<void>();
}
