import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllPlay } from './all-play';
import { AllTimeAllPlayMatrixService } from './all-play-matrix.service';

describe('AllPlay', () => {
  let component: AllPlay;
  let fixture: ComponentFixture<AllPlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllPlay],
      providers: [
        {
          provide: AllTimeAllPlayMatrixService,
          useValue: { buildMatrix: () => null },
        },
      ],
    })
    .compileComponents();

    fixture = TestBed.createComponent(AllPlay);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
