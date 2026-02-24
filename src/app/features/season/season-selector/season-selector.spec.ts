import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonSelector } from './season-selector';

describe('SeasonSelector', () => {
  let component: SeasonSelector;
  let fixture: ComponentFixture<SeasonSelector>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonSelector]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonSelector);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
