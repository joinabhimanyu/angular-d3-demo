import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlexLayoutModule } from '@angular/flex-layout';
import { DragulaModule } from 'ng2-dragula';

import { SharedModule } from '../shared/shared.module';
import { SnapshotComponent } from './snapshot.component';

// Patient Concerns component
import { PatientConcernsModule } from '@sutterhealth/patient-concerns';
// Progress Note
import { ProgressNotesModule } from '@sutterhealth/progress-notes';

// Neuro Graph components
// import { NeuroGraphModule } from '@sutterhealth/neuro-graph';
import { NeuroGraphModule } from '../neuro-graph/neuro-graph.module';

import {
  MdTooltipModule,
  MdCardModule,
  MdDialogModule,
  MatInputModule,
  MdListModule,
  MdMenuModule,
  MdRadioModule,
  MdRippleModule,
  MdSelectModule,
  MdToolbarModule,
} from '@angular/material';

@NgModule({
  imports: [
    CommonModule,
    SharedModule,
    MdSelectModule,
    MdTooltipModule,
    MdCardModule,
    MdDialogModule,
    PatientConcernsModule.forRoot(),
    MatInputModule,
    FlexLayoutModule,
    NeuroGraphModule.forRoot(),
    ProgressNotesModule,
    DragulaModule
  ],
  declarations: [
    SnapshotComponent
  ]
})
export class SnapshotModule { }
