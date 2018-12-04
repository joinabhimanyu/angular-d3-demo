import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { NeuroRelatedComponent } from './neuro-related.component';

describe('NeuroRelatedComponent', () => {
  let component: NeuroRelatedComponent;
  let fixture: ComponentFixture<NeuroRelatedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ NeuroRelatedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(NeuroRelatedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
