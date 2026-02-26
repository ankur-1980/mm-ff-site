import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { SeasonDraft } from './season-draft';
import { DraftRostersDataService } from '../../../data/draft-rosters-data.service';
import { SeasonStandingsDataService } from '../../../data/season-standings-data.service';

describe('SeasonDraft', () => {
  let component: SeasonDraft;
  let fixture: ComponentFixture<SeasonDraft>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonDraft],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: { parent: null, params: of({ year: '2025' }) },
        },
        {
          provide: DraftRostersDataService,
          useValue: { getRostersForSeason: () => ({}) },
        },
        {
          provide: SeasonStandingsDataService,
          useValue: { getStandingsForSeason: () => ({}) },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(SeasonDraft);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
