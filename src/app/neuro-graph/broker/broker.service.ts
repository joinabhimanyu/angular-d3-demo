import { Injectable } from '@angular/core';
import { Http, URLSearchParams, Headers, RequestOptions } from '@angular/http';
import { Subject } from 'rxjs/Subject';
import { Observable } from 'rxjs/Observable';
import { messages, httpTimeoutMillis } from './broker.config';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/filter';
import 'rxjs/add/observable/forkJoin';
import { allMessages } from '../neuro-graph.config';

@Injectable()
export class BrokerService {
  subject: Subject<any>;
  subject1: Subject<any>;
  public urlMaps: {};
  isHide: boolean = true;
  counter: number = 0;
  neuroRelated: any = {};
  cache: any = {};
  errorMessageId: string = 'broker.service:error';
  successMessageId: string = 'broker.service:success';
  warningMessageId: string = 'broker.service:warning';
  source: any;

  constructor(private http: Http) {
    this.subject = new Subject();
    this.subject1 = new Subject();
  }

  initNeuroRelated(get, set) {
    this.neuroRelated.get = get;
    this.neuroRelated.set = set;
  }

  refreshCache() {
    const neuroRelatedState = this.neuroRelated.get();
    this.cache = {};
    this.neuroRelated.set(neuroRelatedState);
    this.emit(allMessages.refreshVirtualCaseload);
  }

  init(urlMaps) {
    this.urlMaps = urlMaps;
  }

  emit(id: string, options?: any) {
    this
      .subject
      .next({ id: id, data: options });
  };

  filterOn(id: string): Observable<any> {
    return (this.subject.filter(d => (d.id === id)));
  };

  hashCode(s: string) {
    let hash = 0; const len = s.length;
    if (s.length === 0) {
      return hash;
    }
    for (let i = 0; i < len; i++) {
      const charC = s.charCodeAt(i);
      hash = ((hash << 5) - hash) + charC;
      hash = hash & hash;
    }
    return (hash.toString());
  }

  httpPost(id: string, body?: any, carryBag?: any) {
    this.counter++;
    this.isHide = false;
    const url = this.urlMaps[id];
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    this.http.post(url, body, { headers: headers })
      .timeout(httpTimeoutMillis)
      .map((response: any) => {
        if (response && response._body) {
          return response.json();
        } else {
          return {};
        }
      })
      .subscribe(d => {
        this.subject.next({ id: id, data: d, body: body, carryBag: carryBag });
        (--this.counter === 0) && (this.isHide = true);
      }, err => {
        this.subject.next({ id: id, error: err, carryBag: carryBag });
        this.subject.next({
          id: this.errorMessageId,
          error: err.name === 'TimeoutError' ? messages.httpTimeoutError : messages.httpPostUnknownError
        });
        (--this.counter === 0) && (this.isHide = true);
      });
  };

  httpPut(id: string, body?: any, carryBag?: any) {
    this.counter++;
    this.isHide = false;
    const url = this.urlMaps[id];
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    this.http.put(url, body, { headers: headers })
      .timeout(httpTimeoutMillis)
      .map((response: any) => {
        if (response && response._body) {
          return response.json();
        } else {
          return {};
        }
      })
      .subscribe(d => {
        this.subject.next({ id: id, data: d, body: body, carryBag: carryBag });
        (--this.counter === 0) && (this.isHide = true);
      }, err => {
        this.subject.next({ id: id, error: err, carryBag: carryBag });
        this.subject.next({
          id: this.errorMessageId,
          error: err.name === 'TimeoutError' ? messages.httpTimeoutError : messages.httpPutUnknownError
        });
        (--this.counter === 0) && (this.isHide = true);
      });
  };

  httpDelete(id: string, body?: any, carryBag?: any) {
    this.counter++;
    this.isHide = false;
    const url = this.urlMaps[id];
    const headers = new Headers();
    headers.append('Content-Type', 'application/json');
    this.http.delete(url, { headers: headers, body: body })
      .timeout(httpTimeoutMillis)
      .map((response: any) => {
        if (response && response._body) {
          return response.json();
        } else {
          return {};
        }
      })
      .subscribe(d => {
        this.subject.next({ id: id, data: d, body: body, carryBag: carryBag });
        (--this.counter === 0) && (this.isHide = true);
      }, err => {
        this.subject.next({ id: id, error: err, carryBag: carryBag });
        this.subject.next({
          id: this.errorMessageId,
          error: err.name === 'TimeoutError' ? messages.httpTimeoutError : messages.httpDeleteUnknownError
        });
        (--this.counter === 0) && (this.isHide = true);
      });
  };

  httpGet(id: string, queryParams?: { name: string, value: string }[], headers?: [any], carryBag?: any) {
    try {
      this.counter++;
      this.isHide = false;
      const url = this.urlMaps[id];
      const myParams = new URLSearchParams();
      queryParams && (queryParams.map(x => myParams.append(x.name, x.value)));

      const signature = { id: id, params: queryParams || '', method: 'httpGet' };
      const hash = this.hashCode(JSON.stringify(signature));
      if (this.cache[hash]) {
        this.subject.next({ id: id, data: this.cache[hash].data, carryBag: carryBag });
        (--this.counter === 0) && (this.isHide = true);
        return;
      }

      myParams.append('timestamp', (+new Date()).toString());

      const myHeaders = new Headers();
      headers && (headers.map(x => myHeaders.append(x.name, x.value)));

      const options = new RequestOptions({
        headers: headers ? myHeaders : null,
        params: myParams
      });

      if (url) {
        this.http.get(url, options)
          .timeout(httpTimeoutMillis)
          .map(response => response.json())
          .subscribe(d => {
            this.subject.next({ id: id, data: d, carryBag: carryBag });
            this.cache[hash] || (this.cache[hash] = {});
            this.cache[hash].signature = signature;
            this.cache[hash].data = d;
            (--this.counter === 0) && (this.isHide = true);
          }, err => {
            this.subject.next({ id: id, error: err });
            (--this.counter === 0) && (this.isHide = true);
            this.subject.next({
              id: this.errorMessageId,
              error: (err.name === 'TimeoutError') ? messages.httpTimeoutError : messages.httpGetUnknownError
            });
          });
      } else {
        this.subject.next({ id: id, error: messages.idNotMappedToUrl });
        (--this.counter === 0) && (this.isHide = true);
        this.subject.next({ id: this.errorMessageId, error: messages.idNotMappedToUrl });
      }
    } catch (err) {
      this.subject.next({ id: id, error: messages.httpGetUnknownError });
      (--this.counter === 0) && (this.isHide = true);
      this.subject.next({ id: this.errorMessageId, error: messages.httpGetUnknownError });
    }
  };

  httpGetMany(messageId: string, queries: {
    urlId: string, queryParams?:
    { name: string, value: string }[], headers?: { name: string, value: string }[]
  }[], carryBag?: any) {
    try {
      this.isHide = false;
      this.counter++;

      const signature = { id: messageId, params: queries || '', method: 'httpGetMany' };
      const hash = this.hashCode(JSON.stringify(signature));
      if (this.cache[hash]) {
        this.subject.next({ id: messageId, data: this.cache[hash].data, carryBag: carryBag });
        (--this.counter === 0) && (this.isHide = true);
        return;
      }

      const temp = queries.map(t => {
        const url = this.urlMaps[t.urlId];

        const myParams = new URLSearchParams();
        t.queryParams && (t.queryParams.forEach(x => myParams.append(x.name, x.value)));
        myParams.append('timestamp', (+new Date()).toString());

        const myHeaders = new Headers();
        t.headers && (t.headers.forEach(x => myHeaders.append(x.name, x.value)));

        const options = new RequestOptions({
          headers: t.headers ? myHeaders : null,
          params: myParams
        });

        return ({ url: url, options: options });
      });
      const emptyUrl = temp.find(x => !Boolean(x.url));
      if (emptyUrl) {
        this.subject.next({ id: messageId, error: messages.idNotMappedToUrl });
        (--this.counter === 0) && (this.isHide = true);
        this.subject.next({ id: this.errorMessageId, error: messages.idNotMappedToUrl });
        return;
      }
      const forks = temp.map(x => this.http.get(x.url, x.options).map(res => res.json()));
      Observable.forkJoin(forks)
        .subscribe(d => {
          d = d.map((x, i) => {
            const urlId = queries[i].urlId;
            const y = {};
            y[urlId] = x;
            return (y);
          });
          this.subject.next({ id: messageId, data: d, carryBag: carryBag });
          (--this.counter === 0) && (this.isHide = true);
          this.cache[hash] || (this.cache[hash] = {});
          this.cache[hash].signature = signature;
          this.cache[hash].data = d;
        }, err => {
          this.subject.next({ id: messageId, error: err });
          (--this.counter === 0) && (this.isHide = true);
          this.subject.next({
            id: this.errorMessageId,
            error: err.name === 'TimeoutError' ? messages.httpTimeoutError : messages.httpGetUnknownError
          });
        });
    } catch (err) {
      this.subject.next({ id: messageId, error: messages.httpGetUnknownError });
      (--this.counter === 0) && (this.isHide = true);
      this.subject.next({ id: this.errorMessageId, error: messages.httpGetUnknownError });
    }
  }
  generateRandomString() {
    let text = '';
    const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

    for (let i = 0; i < 5; i++) {
      text += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return text;
  }
}
