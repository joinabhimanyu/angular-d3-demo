import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RelapsesComponent } from './relapses.component';

describe('RelapsesComponent', () => {
  let component: RelapsesComponent;
  let fixture: ComponentFixture<RelapsesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RelapsesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RelapsesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
