import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  MdTooltipModule,
  MdCardModule,
  MdDialogModule,
  MatInputModule
} from '@angular/material';
import 'hammerjs';
import { AppComponent } from './app.component';
import { FlexLayoutModule } from '@angular/flex-layout';
// App modules
import { CoreModule } from './core/core.module';
import { SharedModule } from './shared/shared.module';
import { SnapshotModule } from './snapshot/snapshot.module';
import { AppRoutingModule } from './core/app-routing.module';
import { ProgressNoteComponent } from './progress-note/progress-note.component';
import { DragulaModule } from 'ng2-dragula';
import { NgIdleModule } from '@ng-idle/core';
// Eval Module
import { EvalModule, EvalService, EvalEventDirective } from '@sutterhealth/analytics';
import { environment } from '../environments/environment';
// API SDK
import { ServicesSdkModule, SdkService } from '@sutterhealth/data-services';
// Authentication Module
import { AuthenticationModule, AuthenticationService, SessionService } from '@sutterhealth/user-authentication';
// Widgets Module
import { WidgetsModule, FeedbackReportComponent } from '@sutterhealth/widgets';
// Patient Concerns
import { PatientConcernsModule } from '@sutterhealth/patient-concerns';
// Progress Notes
import { ProgressNotesModule, ProgressNotesGeneratorService } from '@sutterhealth/progress-notes';

@NgModule({
  declarations: [
    AppComponent,
    ProgressNoteComponent,
  ],
  imports: [
    CoreModule,
    SharedModule,
    SnapshotModule,
    BrowserModule,
    FormsModule,
    AppRoutingModule,
    EvalModule.forRoot(),
    ServicesSdkModule,
    AuthenticationModule,
    WidgetsModule,
    FlexLayoutModule,
    ProgressNotesModule,
    DragulaModule,
    MdTooltipModule,
    MdCardModule,
    MdDialogModule,
    MatInputModule,
    FlexLayoutModule,
    ProgressNotesModule.forRoot(),
    DragulaModule,
    NgIdleModule.forRoot(),
  ],
  providers: [EvalService, ProgressNotesGeneratorService],
  bootstrap: [AppComponent],
  entryComponents: [FeedbackReportComponent]
})

export class AppModule {

  constructor(evalService: EvalService, sdk: SdkService, auth: AuthenticationService, progressNotesGenerator: ProgressNotesGeneratorService) {

    sdk.setEnvironment(environment.envName);
    evalService.setEnvironment(environment.envName);
    auth.setConfig({
      skipValidation: environment.skipTokenValidation,
      matrix: environment.authMatrix,
      project: environment.appName,
      timeOut: environment.timeOut
    });

    evalService.sendSessionData({
      contact_serial_number: null,
      instigator_application: '',
      application_name: 'NEURO-SHARE',
      application_version: '1.0',
      component: '',
      component_version: '1.0',
      patient_identifier: null,
      solution: 'NEURO-SHARE',
      solution_version: '1.0',
      username: null,
      trackEval: environment.trackEval
    });
    progressNotesGenerator.setAutoSaveTimer(environment.autoSaveProgressNoteTimer);
  }
}
