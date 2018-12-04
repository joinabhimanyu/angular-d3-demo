import {
  Component,
  OnInit,
  ViewEncapsulation,
  ChangeDetectorRef
} from '@angular/core';
import { BrokerService } from '../broker/broker.service';
import { allMessages } from '../neuro-graph.config';
import { EvalService } from '@sutterhealth/analytics';
import { OnDestroy, AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { messages } from '../broker/broker.config';
@Component({
  selector: 'app-neuro-related', templateUrl: './neuro-related.component.html',
  styleUrls: ['./neuro-related.component.scss'], encapsulation: ViewEncapsulation.None
})
export class NeuroRelatedComponent implements OnInit, OnDestroy, AfterViewInit {
  display: Boolean = false;

  items: any = {
    dmt: true
    , otherMeds: false
    , vitaminD: false
    , edss: true
    , walk25Feet: false
    , relapses: false
    , imaging: false
    , symptoms: false
    , labs: true
  };
  isAddAllowed: boolean = true;

  constructor(private brokerService: BrokerService, private evalService: EvalService,
    private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.brokerService.initNeuroRelated(
      () => this.items,
      (items) => {
        this.items = items;
        Object.keys(items).forEach(
          x => {
            this.brokerService.emit(allMessages.neuroRelated, {
              artifact: x,
              checked: items[x]
            });
          }
        );
      }
    );
  }

  ngAfterViewInit() {
    this.items['dmt'] = true;
    this.brokerService.emit(allMessages.neuroRelated, {
      artifact: 'dmt',
      checked: true
    });
    this.items['edss'] = true;
    this.brokerService.emit(allMessages.neuroRelated, {
      artifact: 'edss',
      checked: true
    });
    this.items['labs'] = true;
    this.brokerService.emit(allMessages.neuroRelated, {
      artifact: 'labs',
      checked: true
    });
  };

  changed(e, value) {
    const evalData = {
      label: value,
      data: e.checked,
      type: 'checkbox'
    };
    this.evalService.sendEvent(evalData);
    this.brokerService.emit(allMessages.neuroRelated, {
      artifact: value,
      checked: e.checked
    });
  }

  getStyle() {
    if (this.isAddAllowed === false) {
      return '#b0b0b0';
    } else {
      return '#000';
    }
  }
  openDialog(type) {
    if (this.isAddAllowed === true) {
      switch (type) {
        case 'relapses':
          this.items['relapses'] = true;
          this
            .brokerService
            .emit(allMessages.invokeAddRelapses);
          break;
        case 'edss':
          this.items['edss'] = true;
          this
            .brokerService
            .emit(allMessages.invokeAddEdss);
          break;
        case 'walk25Feet':
          this.items['walk25Feet'] = true;
          this
            .brokerService
            .emit(allMessages.invokeAddWalk25Feet);
          break;
        default:
      }
    }
  }

  ngOnDestroy(): void {
  }
}
