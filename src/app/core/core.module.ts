import { NgModule } from '@angular/core';
import { CommonModule, APP_BASE_HREF } from '@angular/common';
import { HttpModule, Http, XHRBackend, RequestOptions } from '@angular/http';
import { ActivatedRoute } from '@angular/router';

import { SpinnerComponent } from './spinner/spinner.component';

import { EventHttpService } from './event-http/event-http.service';
import { AppointmentsService } from './services/appointments.service';


//Services


import { EvalEventDirective } from '@sutterhealth/analytics';


@NgModule({
  imports: [
    CommonModule
  ],
  declarations: [
    SpinnerComponent
  ],
  exports: [ 
    SpinnerComponent
  ],
  providers: [
    AppointmentsService,
    EventHttpService,
    {
      provide: APP_BASE_HREF,
      useValue: '/'
    }
  ]
})

export class CoreModule {
  
}
