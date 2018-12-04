import { Component, OnInit } from '@angular/core';
import { EhrService, MsService } from '@sutterhealth/data-services';
import { SessionService } from '@sutterhealth/user-authentication';
import { EvalService } from '@sutterhealth/analytics';
import { NotesWriterComponent, ProgressNotesGeneratorService } from '@sutterhealth/progress-notes';

import * as _ from 'lodash';

@Component({
  selector: 'app-snapshot',
  templateUrl: './snapshot.component.html',
  styleUrls: ['./snapshot.component.scss']
})

export class SnapshotComponent implements OnInit {

  public patientConcernsData = [];
  public patientName: string;
  public csn: string;
  readOnlyNote: boolean = false;

  lastProgressNote: Object = {
    date: {
      creation: null
    },
    htmlText: null
  };

  constructor(private ehr: EhrService, private session: SessionService, private evalService: EvalService, private msService: MsService,
    private ehrService: EhrService) { }
  // , private progressNotesGenerator: ProgressNotesGeneratorService) { }

  ngOnInit() {
    const blankNote = '';
    this.session.getParams().subscribe(params => {
      if (params['pom_id']) {
        this.ehr.getProgressNotes(params['pom_id']).subscribe((notes: any) => {
          this.lastProgressNote = Object.assign({}, this.lastProgressNote, _.last(notes));
        });
        this.ehrService.getDemographicsM2(params['pom_id']).subscribe(data => {
          if (data['EPIC']) {
            this.patientName = data['EPIC'].patientDemographics.name.first;
          }
        });
      }
      /*if (params['csn']) {
        this.msService.getPatientConcerns(params['pom_id']).subscribe(res => {
          this.patientConcernsData = res.Patient_Concerns;
        });
      }*/
      if (params['csn']) {
        this.csn = params['csn'];
      }
      if (params['csn_status'] && params['csn_status'] === 'Closed') {
        this.readOnlyNote = true;
      }
      this.evalService.updateSessionData({
        username: params['login_id'],
        application_name: 'NEURO-SHARE',
        patient_identifier: params['patient_identifier'],
        uuid: ''
      });
    });
  }
}
