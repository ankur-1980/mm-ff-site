import { Component, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-cta-button',
  imports: [RouterLink],
  templateUrl: './cta-button.html',
  styleUrl: './cta-button.scss',
})
export class CtaButton {
  readonly label = input.required<string>();
  readonly route = input<string | null>(null);
  readonly ariaLabel = input<string>('');
  readonly stretch = input<boolean>(false);
  readonly pressed = output<void>();
}
