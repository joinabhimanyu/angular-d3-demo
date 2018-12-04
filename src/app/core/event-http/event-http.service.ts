import { Injectable } from '@angular/core';
import { Http, RequestOptions, RequestOptionsArgs, Response, XHRBackend, Headers } from '@angular/http';
import { Observable } from 'rxjs/Observable';
import { Observer } from 'rxjs/Observer';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import 'rxjs/add/operator/share';


@Injectable()
export class EventHttpService {
  private currentRequests: number = 0;
  private spinnerObserver: Observer<boolean>;
  public spinnerObservable: Observable<boolean>;

  public constructor(_backend: XHRBackend, _defaultOptions: RequestOptions, private http: Http) {

    this.spinnerObservable = new Observable(observer => {
      this.spinnerObserver = observer;
    }).share();
  }

  public get(url: string): Observable<any> {
    const response = this.http.get(url);
    this.incrementRequestCount();
    response.subscribe(null, error => {
      this.decrementRequestCount();
    }, () => {
      this.decrementRequestCount();
    });
    return response;
  }

  private decrementRequestCount() {
    if (--this.currentRequests === 0) {
      if (this.spinnerObserver) {
        this.spinnerObserver.next(false);
      }

    }
  }

  private incrementRequestCount() {
    if (this.currentRequests++ === 0) {
      if (this.spinnerObserver) {
        this.spinnerObserver.next(true);
      }
    }
  }
}
