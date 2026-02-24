import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeasonDraft } from './season-draft';

describe('SeasonDraft', () => {
  let component: SeasonDraft;
  let fixture: ComponentFixture<SeasonDraft>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeasonDraft]
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
