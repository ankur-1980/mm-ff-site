import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonAwards } from './season-awards';

describe('SeasonAwards', () => {
  let component: SeasonAwards;
  let fixture: ComponentFixture<SeasonAwards>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonAwards]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonAwards);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
