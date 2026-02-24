import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonPowerStandings } from './season-power-standings';

describe('SeasonPowerStandings', () => {
  let component: SeasonPowerStandings;
  let fixture: ComponentFixture<SeasonPowerStandings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonPowerStandings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonPowerStandings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
