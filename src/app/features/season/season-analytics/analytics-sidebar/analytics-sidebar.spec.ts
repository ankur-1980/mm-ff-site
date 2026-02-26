import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnalyticsSidebar } from './analytics-sidebar';

describe('AnalyticsSidebar', () => {
  let component: AnalyticsSidebar;
  let fixture: ComponentFixture<AnalyticsSidebar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnalyticsSidebar]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AnalyticsSidebar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
