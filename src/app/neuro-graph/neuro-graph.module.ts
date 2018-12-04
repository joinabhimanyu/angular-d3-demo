import { NgModule, ModuleWithProviders } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import {
  MdButtonModule, MdMenuModule, MdCheckboxModule, MdSelectModule, MdInputModule, MdDialogModule,
  MdTooltipModule, MdGridListModule, MatProgressSpinnerModule, MatSnackBarModule
} from '@angular/material';
import { GraphPanelComponent } from './graph-panel/graph-panel.component';
import { NeuroRelatedComponent } from './neuro-related/neuro-related.component';
import { BrokerModule } from './broker/broker.module';
import { NeuroGraphService } from './neuro-graph.service';
import { MedicationsComponent } from './graph-panel/medications/medications.component';
import { CdsComponent } from './cds/cds.component';
import { SharedGridComponent } from './graph-panel/shared-grid/shared-grid.component';
import { EdssComponent } from './graph-panel/edss/edss.component';
import { RelapsesComponent } from './graph-panel/relapses/relapses.component';
import { InfoPopupComponent } from './cds/info-popup/info-popup.component';
import { ImagingComponent } from './graph-panel/imaging/imaging.component';
import { LabsComponent } from './graph-panel/labs/labs.component';
import { EvalModule } from '@sutterhealth/analytics';

import { TwentyFiveFootWalkComponent } from './graph-panel/twenty-five-foot-walk/twenty-five-foot-walk.component';
import { SymptomsComponent } from './graph-panel/symptoms/symptoms.component';
import { AuthenticationModule, AuthenticationService } from '@sutterhealth/user-authentication';

export * from './broker/broker.module';
export * from './cds/cds.component';
export * from './cds/info-popup/info-popup.component';
export * from './graph-panel/graph-panel.component';
export * from './graph-panel/edss/edss.component';
export * from './graph-panel/imaging/imaging.component';
export * from './graph-panel/labs/labs.component';
export * from './graph-panel/medications/medications.component';
export * from './graph-panel/relapses/relapses.component';
export * from './graph-panel/shared-grid/shared-grid.component';
export * from './graph-panel/symptoms/symptoms.component';
export * from './graph-panel/twenty-five-foot-walk/twenty-five-foot-walk.component';
export * from './graph-panel/graph-panel.component';
export * from './neuro-related/neuro-related.component';
export * from './neuro-graph.service';

export const ROUTES: Routes = [];
@NgModule({
  imports: [
    BrokerModule.forRoot(),
    CommonModule,
    FormsModule,
    RouterModule.forRoot(ROUTES),
    MdButtonModule,
    MdMenuModule,
    MdCheckboxModule,
    MdSelectModule,
    MdInputModule,
    MdDialogModule,
    MdTooltipModule,
    MdGridListModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    EvalModule.forRoot(),
    AuthenticationModule
  ],
  declarations: [
    GraphPanelComponent,
    NeuroRelatedComponent,
    MedicationsComponent,
    CdsComponent,
    EdssComponent,
    SharedGridComponent,
    RelapsesComponent,
    InfoPopupComponent,
    ImagingComponent,
    LabsComponent,
    TwentyFiveFootWalkComponent,
    SymptomsComponent
  ],
  exports: [
    CdsComponent,
    GraphPanelComponent,
    NeuroRelatedComponent,
    BrokerModule
  ],
  bootstrap: [InfoPopupComponent]
})
export class NeuroGraphModule {
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: NeuroGraphModule,
      providers: [NeuroGraphService]
    };
  }
}
