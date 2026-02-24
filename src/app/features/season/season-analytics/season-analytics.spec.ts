import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonAnalytics } from './season-analytics';

describe('SeasonAnalytics', () => {
  let component: SeasonAnalytics;
  let fixture: ComponentFixture<SeasonAnalytics>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonAnalytics]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonAnalytics);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
