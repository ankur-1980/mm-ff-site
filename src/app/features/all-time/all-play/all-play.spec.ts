import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AllPlay } from './all-play';

describe('AllPlay', () => {
  let component: AllPlay;
  let fixture: ComponentFixture<AllPlay>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AllPlay]
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
