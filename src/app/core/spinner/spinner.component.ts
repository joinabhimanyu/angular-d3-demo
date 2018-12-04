import { Component, OnInit } from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { EventHttpService } from '../event-http/event-http.service';

@Component({
  selector: 'spinner',
  templateUrl: './spinner.component.html',
  styleUrls: ['./spinner.component.scss']
})
export class SpinnerComponent  {

  subscription: Subscription;
  showSpinner: boolean = false;

  constructor(private _eventService: EventHttpService) { }

  ngOnInit() {
    this._eventService.spinnerObservable.subscribe((res) => {
        this.showSpinner = res;
    });
  }
}
