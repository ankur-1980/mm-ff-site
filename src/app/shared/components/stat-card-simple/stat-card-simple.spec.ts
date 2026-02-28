import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatCardSimple } from './stat-card-simple';

describe('StatCardSimple', () => {
  let component: StatCardSimple;
  let fixture: ComponentFixture<StatCardSimple>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatCardSimple]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatCardSimple);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
