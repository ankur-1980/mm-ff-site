import { Component, input } from '@angular/core';

@Component({
  selector: 'app-section-header',
  imports: [],
  templateUrl: './section-header.html',
  styleUrl: './section-header.scss',
})
export class SectionHeader {
  readonly label = input<string>('');
  readonly heading = input<string>('');
  readonly meta = input<string[]>([]);
  readonly tertiaryMeta = input<string[]>([]);
}
