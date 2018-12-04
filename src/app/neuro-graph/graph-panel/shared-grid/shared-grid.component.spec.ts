import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SharedGridComponent } from './shared-grid.component';

describe('SharedGridComponent', () => {
  let component: SharedGridComponent;
  let fixture: ComponentFixture<SharedGridComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SharedGridComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SharedGridComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
