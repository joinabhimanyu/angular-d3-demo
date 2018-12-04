import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  MdCardModule,
  MatTooltipModule,
  MatSelectModule,
  MatInputModule
} from '@angular/material';

import { DemographicBarComponent } from './demographic-bar/demographic-bar.component';

import { FlexLayoutModule } from '@angular/flex-layout';

import { NotesService } from './services/notes/notes.service';
import { ActivityService } from './services/activity/activity.service';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
// Widgets Module
import { WidgetsModule } from '@sutterhealth/widgets';
import { EvalModule, EvalService, EvalEventDirective } from '@sutterhealth/analytics';
import { ProgressNotesModule } from '@sutterhealth/progress-notes';
import { DragulaModule } from 'ng2-dragula';
import { AuthenticationModule } from '@sutterhealth/user-authentication';

// Neuro Graph components
// import { NeuroGraphModule } from '@sutterhealth/neuro-graph';
import { NeuroGraphModule } from '../neuro-graph/neuro-graph.module';

@NgModule({
  imports: [
    CommonModule,
    RouterModule,
    FlexLayoutModule,
    MdCardModule,
    MatTooltipModule,
    WidgetsModule,
    FormsModule,
    BrowserAnimationsModule,
    MatSelectModule,
    EvalModule.forRoot(),
    MatInputModule,
    ProgressNotesModule,
    DragulaModule,
    AuthenticationModule,
    NeuroGraphModule.forRoot()
  ],
  declarations: [
    DemographicBarComponent,
  ],
  exports: [
    DemographicBarComponent,
    RouterModule,
    FlexLayoutModule,
    FormsModule,
    ProgressNotesModule
  ],
  providers: [
    NotesService,
    ActivityService,
    EvalService
  ]
})
export class SharedModule { }
