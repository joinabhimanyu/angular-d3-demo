
import { Component, OnInit, ViewEncapsulation, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import { MdDialog, MdDialogRef, MdSnackBar } from '@angular/material';
import * as d3 from 'd3';
import { ProgressNotesGeneratorService } from '@sutterhealth/progress-notes';
import { BrokerService } from '../broker/broker.service';
import { NeuroGraphService } from '../neuro-graph.service';
import { allMessages, GRAPH_SETTINGS, errorMessages, allHttpMessages } from '../neuro-graph.config';
import { SharedGridComponent } from '../graph-panel/shared-grid/shared-grid.component';
import { RelapsesComponent } from '../graph-panel/relapses/relapses.component';
import { ImagingComponent } from '../graph-panel/imaging/imaging.component';
import { LabsComponent } from '../graph-panel/labs/labs.component';
import { MedicationsComponent } from '../graph-panel/medications/medications.component';
import { EdssComponent } from '../graph-panel/edss/edss.component';
import { SdkService } from '@sutterhealth/data-services';

@Component({
  selector: 'app-graph-panel',
  templateUrl: './graph-panel.component.html',
  styleUrls: ['./graph-panel.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class GraphPanelComponent implements OnInit, OnDestroy {

  @ViewChild('virtualCaseloadInfoTemplate') virtualCaseloadInfoTemplate: TemplateRef<any>;
  state: any;
  subscriptions: any;
  virtualCaseloadInfoDialogRef: MdDialogRef<any>;
  isEdssSelected: boolean = true;
  virtualCaseloadEnabled: boolean = false;
  defaultScaleSpanInMonths = 36;
  dataBufferStartDate = new Date((new Date()).getFullYear() - 2, 0, 1);
  scaleMinDate = new Date(1970, 0, 1);
  scaleMaxDate = new Date((new Date()).getFullYear(), 11, 31);
  graphSetting = GRAPH_SETTINGS;
  loadingProgressState = {
    labs: false,
    imaging: false,
    relapses: false,
    symptoms: false,
    edss: false,
    walk25feet: false,
    medication: false
  };
  medicationTopPos: any;
  medicationHeight: any;
  learnMoreUrl: string;

  constructor(
    public brokerService: BrokerService,
    private dialog: MdDialog,
    private neuroGraphService: NeuroGraphService,
    public snackBar: MdSnackBar,
    private progressNotesGeneratorService: ProgressNotesGeneratorService,
    private sdk: SdkService) {
  }

  ngOnInit() {
    this.setLearnMoreUrl();
    this.setDefaultState();
    this.medicationHeight = this.graphSetting.medications.containerHeight;
    this.medicationTopPos = this.graphSetting.medications.positionTop;
    const obsEdss = this.brokerService.filterOn(allMessages.neuroRelated).filter(t => (t.data.artifact === 'edss'));
    const sub0 = obsEdss.filter(t => t.data.checked).subscribe(d => {
      d.error
        ? console.log(d.error)
        : (() => {
          this.isEdssSelected = true;
        })();
    });
    const sub1 = obsEdss.filter(t => !t.data.checked).subscribe(d => {
      d.error
        ? console.log(d.error)
        : (() => {
          this.isEdssSelected = false;
        })();
    });
    const sub2 = this.brokerService.filterOn(allMessages.timelineScroll).subscribe(d => {
      d.error
        ? console.log(d.error)
        : (() => {
          this.timelineScroll(d.data);
        })();
    });
    const sub3 = this.brokerService.filterOn(this.brokerService.errorMessageId).subscribe(d => {
      this.showError(d.error);
    });

    const sub4 = this.brokerService.filterOn(allMessages.showCustomError).subscribe(d => {
      const array = d.data.split(',');
      const errMsg: Array<any> = [];
      array.forEach(element => {
        const msg = '  ' + element + ' : ' + errorMessages[element].message + '  ';
        errMsg.push(msg);
      });
      this.showError(errMsg);
    });

    const sub5 = this.brokerService.filterOn(allMessages.showLogicalError).subscribe(d => {
      setTimeout(() => {
        const msg = errorMessages.logicalError.replace('{{component}}', d.data);
        this.showError(msg);
      }, 3000);
    });
    const sub6 = this.brokerService.filterOn(allHttpMessages.httpGetPatientMsData).subscribe(d => {
      try {
        if (d.data.age_of_onset && !isNaN(parseInt(d.data.age_of_onset, 10))) {
          this.emitToggleVirtualCaseload();
        } else {
          this.brokerService.emit(allMessages.showCustomError, 'M-004');
        }
      } catch (error) {
        this.brokerService.emit(allMessages.showCustomError, 'M-004');
      }
    });
    const sub7 = this.brokerService.filterOn(allMessages.refreshVirtualCaseload).subscribe(() => {
      this.virtualCaseloadEnabled = false;
    });

    this.subscriptions = sub0.add(sub1).add(sub2).add(sub3).add(sub4).add(sub5).add(sub6).add(sub7);
  }
  setLearnMoreUrl(): void {
    const envname = this.sdk.getEnvironmentString() || '';
    let env = '';
    switch (envname) {
      case 'STAGING':
        env = 'dcdlrhr902';
        break;
      case 'QA':
        env = 'dcqlrhr802';
        break;
      case 'VALIDATION':
        env = 'dcplrdd102';
        break;
      case 'PROD':
        env = 'dcplrhr102';
        break;
      default:
        env = 'localhost';
        break;
    }
    if (this.brokerService && this.brokerService.urlMaps) {
      this.learnMoreUrl = this.brokerService.urlMaps[allHttpMessages.virtualCaseloadLearnmore] || '';
      this.learnMoreUrl = this.learnMoreUrl.replace('{{host}}', env);
    }
  }
  emitToggleVirtualCaseload() {
    this.virtualCaseloadEnabled = !this.virtualCaseloadEnabled;
    this.brokerService.emit(allMessages.toggleVirtualCaseload, {
      artifact: this.virtualCaseloadEnabled ? 'add' : 'remove'
    });
  }
  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  toggleEdssVirtualCaseload() {
    if (this.virtualCaseloadEnabled) {
      this.emitToggleVirtualCaseload();
    } else {
      this.brokerService.httpGet(allHttpMessages.httpGetPatientMsData, [
        {
          name: 'pom_id',
          value: this.neuroGraphService.get('queryParams').pom_id
        },
        {
          name: 'randomString',
          value: this.brokerService.generateRandomString()
        }
      ]);
    }
  }

  showVirtualCaseloadInfo(e) {
    const dialogConfig = { hasBackdrop: true, panelClass: 'virtual-caseload-info', width: '300px', height: '200px' };
    this.virtualCaseloadInfoDialogRef = this.dialog.open(this.virtualCaseloadInfoTemplate, dialogConfig);
    this.virtualCaseloadInfoDialogRef.updatePosition({ top: `${e.clientY}px`, left: `${e.clientX}px` });
  }

  onZoomOptionChange(monthsSpan) {
    this.state.zoomMonthsSpan = +monthsSpan;
    this.setXDomain(+monthsSpan, this.state.dataBufferPeriod.toDate);
    this.setXScale();
    this.brokerService.emit(allMessages.graphScaleUpdated, { fetchData: false });
  }

  onResetZoom() {
    this.state.zoomMonthsSpan = this.defaultScaleSpanInMonths;
    this.setXDomain(this.defaultScaleSpanInMonths, this.scaleMaxDate);
    this.setXScale();
    this.setDataBufferPeriod('init');
    this.brokerService.emit(allMessages.graphScaleUpdated, { fetchData: true });
  }

  progressNotes() {
    const timestamp = this.neuroGraphService.moment().toString();
    this.progressNotesGeneratorService.pushObject({
      destination: 'progress-note',
      category: 'progress-note',
      source: 'Graph-panel',
      title: 'Graph-panel',
      editable: false,
      draggable: true,
      data: this.getMarkup(),
      timestamp: timestamp,
      overwrite: true
    });
  }

  getMarkup() {
    const graph = document.getElementById('graph-container').innerHTML;
    const output = `<div style="width:710px;height:560px;overflow:hidden;"><svg width="710" height="560">${graph}</svg></div>`;
    return output;
  }

  enlargeMedicationPanel() {
    this.medicationTopPos === this.graphSetting.medications.positionTop ?
      this.medicationTopPos = this.graphSetting.enlargedMedications.positionTop :
      this.medicationTopPos = this.graphSetting.medications.positionTop;
    this.medicationHeight === this.graphSetting.medications.containerHeight ?
      this.medicationHeight = this.graphSetting.enlargedMedications.containerHeight :
      this.medicationHeight = this.graphSetting.medications.containerHeight;
  }

  setXDomain(montsSpan, spanLastDate) {
    const momentSpanLastDate = this.neuroGraphService.moment(spanLastDate);
    const output = {
      scaleMinValue: this.scaleMinDate,
      scaleMaxValue: this.scaleMaxDate,
      currentMinValue: momentSpanLastDate.clone().subtract(montsSpan, 'month').add(1, 'days').toDate(),
      currentMaxValue: spanLastDate
    };
    this.state.xDomain = output;
  }

  setXScale() {
    this.state.xScale = d3.scaleTime()
      .domain([this.state.xDomain.currentMinValue, this.state.xDomain.currentMaxValue])
      .range([0, this.state.canvasDimension.width]);
  }

  setDefaultState() {
    this.state = {};
    this.state.canvasDimension = {
      offsetHeight: GRAPH_SETTINGS.panel.offsetHeight,
      offsetWidth: GRAPH_SETTINGS.panel.offsetWidth,
      height: GRAPH_SETTINGS.panel.offsetHeight - GRAPH_SETTINGS.panel.marginTop - GRAPH_SETTINGS.panel.marginBottom,
      width: GRAPH_SETTINGS.panel.offsetWidth - GRAPH_SETTINGS.panel.marginLeft - GRAPH_SETTINGS.panel.marginRight,
      marginTop: GRAPH_SETTINGS.panel.marginTop,
      marginRight: GRAPH_SETTINGS.panel.marginRight,
      marginBottom: GRAPH_SETTINGS.panel.marginBottom,
      marginLeft: GRAPH_SETTINGS.panel.marginLeft
    };
    this.state.zoomMonthsSpan = this.defaultScaleSpanInMonths;
    this.setXDomain(this.defaultScaleSpanInMonths, this.scaleMaxDate);
    this.setXScale();
    this.setDataBufferPeriod('init');
  }

  notifyUpdateAndDataShortage() {
    this.brokerService.emit(allMessages.graphScaleUpdated, { fetchData: !this.state.dataBufferPeriod.dataAvailable });
  }

  setDataBufferPeriod(opMode) {
    if (opMode === 'backward') {
      if (this.state.xDomain.currentMinValue < this.state.dataBufferPeriod.fromDate) {

        const mmtNewDataBufferFrom = this.neuroGraphService.moment(new Date(this.state.xDomain.currentMinValue.getFullYear(), 0, 1));
        const newFromDate = mmtNewDataBufferFrom.clone().toDate();
        const newToDate = mmtNewDataBufferFrom.clone().add(this.defaultScaleSpanInMonths, 'month').subtract(1, 'days').toDate();
        this.state.dataBufferPeriod = {
          fromDate: newFromDate,
          toDate: newToDate,
          dataAvailable: false
        };
      } else {
        this.state.dataBufferPeriod.dataAvailable = true;
      }
    } else if (opMode === 'forward') {
      if (this.state.xDomain.currentMaxValue > this.state.dataBufferPeriod.toDate) {

        const mmtNewDataBufferTo = this.neuroGraphService.moment(new Date(this.state.xDomain.currentMaxValue.getFullYear(), 11, 31));
        const newFromDate = mmtNewDataBufferTo.clone().subtract(this.defaultScaleSpanInMonths, 'month').add(1, 'days').toDate();
        const newToDate = mmtNewDataBufferTo.clone().toDate();
        this.state.dataBufferPeriod = {
          fromDate: newFromDate,
          toDate: newToDate,
          dataAvailable: false
        };
      } else {
        this.state.dataBufferPeriod.dataAvailable = true;
      }
    } else {
      this.state.dataBufferPeriod = {
        fromDate: this.dataBufferStartDate,
        toDate: this.scaleMaxDate,
        dataAvailable: true
      };
    }
  }


  timelineScroll(direction) {
    if (direction === 'forward') {
      this.scrollForward();
    } else {
      this.scrollBackward();
    }
  }

  scrollForward() {
    const diff = this.neuroGraphService.moment(this.state.xDomain.currentMaxValue).startOf('day').
      diff(this.neuroGraphService.moment(this.state.xDomain.scaleMaxValue).startOf('day'), 'days');
    if (diff === 0) {
      return;
    }
    const mtNextMonthStart = this.neuroGraphService.moment(this.state.xDomain.currentMaxValue).add(1, 'month').startOf('month');

    let currentMinValue;
    let currentMaxValue;

    if (this.state.zoomMonthsSpan < 12) {
      currentMinValue = this.neuroGraphService.moment(this.state.xDomain.currentMinValue).add(1, 'month').startOf('month').toDate();
      currentMaxValue = this.neuroGraphService.moment(currentMinValue).add(this.state.zoomMonthsSpan, 'month').subtract(1, 'days').toDate();
    } else {
      currentMinValue = this.neuroGraphService.moment(this.state.xDomain.currentMinValue).add(12, 'month').startOf('month').toDate();
      currentMaxValue = this.neuroGraphService.moment(currentMinValue).add(this.state.zoomMonthsSpan, 'month').subtract(1, 'days').toDate();
    }

    this.state.xDomain = {
      ...this.state.xDomain,
      currentMinValue,
      currentMaxValue
    };
    this.setXScale();
    this.setDataBufferPeriod('forward');
    this.notifyUpdateAndDataShortage();
  }

  scrollBackward() {
    const diff = this.neuroGraphService.moment(this.state.xDomain.currentMinValue).startOf('day').
      diff(this.neuroGraphService.moment(this.state.xDomain.scaleMinValue).startOf('day'), 'days');
    if (diff === 0) {
      return;
    }
    const mtLastSpanMinDate = this.neuroGraphService.moment(this.state.xDomain.currentMinValue);

    let currentMinValue;
    let currentMaxValue;

    if (this.state.zoomMonthsSpan < 12) {
      currentMinValue = mtLastSpanMinDate.clone().subtract(1, 'month').toDate();
      currentMaxValue = this.neuroGraphService.moment(currentMinValue).add(this.state.zoomMonthsSpan, 'month').subtract(1, 'days').toDate();
    } else {
      currentMinValue = mtLastSpanMinDate.clone().subtract(12, 'month').toDate();
      currentMaxValue = this.neuroGraphService.moment(currentMinValue).add(this.state.zoomMonthsSpan, 'month').subtract(1, 'days').toDate();
    }

    this.state.xDomain = {
      ...this.state.xDomain,
      currentMinValue,
      currentMaxValue
    };
    this.setXScale();
    this.setDataBufferPeriod('backward');
    this.notifyUpdateAndDataShortage();
  }

  showError(err) {
    this.snackBar.open(err, 'Dismiss', {
      duration: 10000,
      extraClasses: ['neuro-error-snackbar']
    });
  }

  cleanCache() {
    this.brokerService.refreshCache();
  }
}
