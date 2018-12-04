import { TestBed, inject } from '@angular/core/testing';

import { NeuroGraphService } from './neuro-graph.service';

describe('NeuroGraphService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [NeuroGraphService]
    });
  });

  it('should be created', inject([NeuroGraphService], (service: NeuroGraphService) => {
    expect(service).toBeTruthy();
  }));
});
