import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TwentyFiveFootWalkComponent } from './twenty-five-foot-walk.component';

describe('TwentyFiveFootWalkComponent', () => {
  let component: TwentyFiveFootWalkComponent;
  let fixture: ComponentFixture<TwentyFiveFootWalkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TwentyFiveFootWalkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TwentyFiveFootWalkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
