import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonPowerRankings } from './season-power-rankings';

describe('SeasonPowerRankings', () => {
  let component: SeasonPowerRankings;
  let fixture: ComponentFixture<SeasonPowerRankings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonPowerRankings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonPowerRankings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
