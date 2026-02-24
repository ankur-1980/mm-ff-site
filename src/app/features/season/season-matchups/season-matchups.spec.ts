import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonMatchups } from './season-matchups';

describe('SeasonMatchups', () => {
  let component: SeasonMatchups;
  let fixture: ComponentFixture<SeasonMatchups>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonMatchups]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonMatchups);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
