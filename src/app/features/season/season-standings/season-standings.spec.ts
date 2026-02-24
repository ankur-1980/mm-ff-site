import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonStandings } from './season-standings';

describe('SeasonStandings', () => {
  let component: SeasonStandings;
  let fixture: ComponentFixture<SeasonStandings>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonStandings]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonStandings);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
