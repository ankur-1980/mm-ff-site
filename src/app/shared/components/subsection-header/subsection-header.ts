import { Component, input } from '@angular/core';

@Component({
  selector: 'app-subsection-header',
  imports: [],
  templateUrl: './subsection-header.html',
  styleUrl: './subsection-header.scss',
})
export class SubsectionHeader {
  readonly title = input.required<string>();
  readonly isPrimary = input<boolean>(false);
}
