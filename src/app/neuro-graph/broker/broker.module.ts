import { NgModule , ModuleWithProviders} from '@angular/core';
import { CommonModule } from '@angular/common';
import {HttpModule} from '@angular/http';
import {BrokerService} from './broker.service';
export * from './broker.service';
@NgModule({
  imports: [
    CommonModule, HttpModule
  ]
})

export class BrokerModule { 
  static forRoot(): ModuleWithProviders {
    return {
      ngModule: BrokerModule,
      providers: [BrokerService]
    };
  }
}
  
