import { Component, OnInit, Input, ViewEncapsulation, ViewChild, TemplateRef, Inject } from '@angular/core';
import * as d3 from 'd3';
import { GRAPH_SETTINGS } from '../../neuro-graph.config';
import { BrokerService } from '../../broker/broker.service';
import { allMessages, allHttpMessages } from '../../neuro-graph.config';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { NeuroGraphService } from '../../neuro-graph.service';

@Component({
  selector: 'app-relapses,[app-relapses]',
  templateUrl: './relapses.component.html',
  styleUrls: ['./relapses.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class RelapsesComponent implements OnInit {
  @ViewChild('relapsesSecondLevelTemplate') private relapsesSecondLevelTemplate: TemplateRef<any>;
  @ViewChild('relapsesEditSecondLevelTemplate') private relapsesEditSecondLevelTemplate: TemplateRef<any>;
  @ViewChild('relapsesAddSecondLevelTemplate') private relapsesAddSecondLevelTemplate: TemplateRef<any>;

  @Input() private chartState: any;
  private yDomain: Array<number> = [0, 1];
  private width: number;
  private height: number;
  private yScale: any;
  private years = [];
  private month = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September',
    'October', 'November', 'December'];
  private relapsesDetail: any;
  private subscriptions: any;
  private pathUpdate: any;
  private line: any;
  private chart: any;
  private paramData: any;
  private datasetB: Array<any>;
  private dialogRef: any;
  private datasetA: Array<any>;
  private relapsesData: Array<any>;
  private isEditSelected: boolean = false;
  private relapsesOpenAddPopUp: boolean = false;
  private isDateOutOfRange: boolean = false;
  private relapsisChartLoaded: boolean = false;
  private isSymptomsChecked: boolean = false;
  registerDrag: any;
  constructor(private brokerService: BrokerService, public dialog: MdDialog, private neuroGraphService: NeuroGraphService) {
    this.paramData = this.neuroGraphService.get('queryParams');
    this.registerDrag = e => neuroGraphService.registerDrag(e);
  }
  ngOnInit() {
    this.years = Array.from(new Array(100), (val, index) => ((new Date()).getFullYear() - index).toString());
    this.subscriptions = this
      .brokerService
      .filterOn(allHttpMessages.httpGetRelapse)
      .subscribe(d => {
        d.error
          ? (() => {
            console.log(d.error);
            this.brokerService.emit(allMessages.checkboxEnable, 'relapses');
          })()
          : (() => {
            try {
              this.removeChart();
              this.relapsesData = d.data.relapses;

              if (d.data && d.data.relapses && d.data.relapses.length > 0) {
                this.createChart();
              } else {
                this.relapsesData = [];
              }
              this.relapsisChartLoaded = true;
              if (this.relapsesOpenAddPopUp === true) {
                this.relapsesOpenAddPopUp = false;
                const dt = d3.select('#relapses').selectAll('*');
                this.isDateOutOfRange = false;
                this.relapsesDetail = { month: '', year: '' };
                const dialogConfig = { hasBackdrop: true, panelClass: 'ns-relapses-theme', width: '250px' };
                this.dialogRef = this.dialog.open(this.relapsesAddSecondLevelTemplate, dialogConfig);
                this.dialogRef.updatePosition({ top: '335px', left: '255px' });
              }
              this.brokerService.emit(allMessages.checkboxEnable, 'relapses');

              if (d.data && d.data.relapses && d.data.relapses.length > 0 &&
                this.relapsesData.some(obj => obj.relapse_month === '' || obj.relapse_year === '' ||
                  obj.relapse_month === 'No result' || obj.relapse_year === 'No result')) {
                this.brokerService.emit(allMessages.showCustomError, 'D-002');
              }
            } catch (ex) {
              console.log(ex);
              this.brokerService.emit(allMessages.showLogicalError, 'relapses');
              this.brokerService.emit(allMessages.checkboxEnable, 'relapses');
            }
          })();
      });

    const relapses = this
      .brokerService
      .filterOn(allMessages.neuroRelated)
      .filter(t => (t.data.artifact === 'relapses'));

    const modal = this
      .brokerService
      .filterOn(allMessages.invokeAddRelapses);

    const putRelapse = this
      .brokerService
      .filterOn(allHttpMessages.httpPutRelapse)
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : (() => {
            this.requestForData();
            this.dialogRef.close();
          })();
      });

    const postRelapse = this
      .brokerService
      .filterOn(allHttpMessages.httpPostRelapse)
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : (() => {
            this.requestForData();
            this.dialogRef.close();
          })();
      });

    const deleteRelapse = this
      .brokerService
      .filterOn(allHttpMessages.httpDeleteRelapse)
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : (() => {
            this.requestForData();
            this.dialogRef.close();
          })();
      });

    const sub1 = relapses
      .filter(t => t.data.checked)
      .subscribe(d => {
        d.error
          ? (() => {
            console.log(d.error);
          })
          : (() => {
            this.requestForData();
          })();
      });
    const sub2 = relapses
      .filter(t => !t.data.checked)
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : (() => {
            this.removeChart();
            this.relapsisChartLoaded = false;
          })();
      });
    const sub3 = modal
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : (() => {
            const dt = d3.select('#relapses').selectAll('*');
            if (dt['_groups'][0].length === 0) {
              this.relapsesOpenAddPopUp = true;
              this
                .brokerService
                .emit(allMessages.neuroRelated, {
                  artifact: 'relapses',
                  checked: true
                });
            } else {
              this.isDateOutOfRange = false;
              this.relapsesDetail = this.relapsesData[0];
              this.relapsesDetail.month = '';
              this.relapsesDetail.year = '';
              const dialogConfig = { hasBackdrop: true, panelClass: 'ns-relapses-theme', width: '250px' };
              this.dialogRef = this.dialog.open(this.relapsesAddSecondLevelTemplate, dialogConfig);
              this.dialogRef.updatePosition({ top: '335px', left: '255px' });
            }

          })();
      });
    const sub4 = this.brokerService.filterOn(allMessages.graphScaleUpdated).subscribe(d => {
      d.error ? console.log(d.error) : (() => {
        if (this.relapsisChartLoaded) {
          if (d.data.fetchData) {
            this.removeChart();
            this.brokerService.emit(allMessages.neuroRelated, { artifact: 'relapses', checked: true });
          } else {
            this.removeChart();
            this.createChart();
          }
        }
      })();
    });


    const subSympChecked = this
      .brokerService
      .filterOn(allMessages.neuroRelated)
      .filter(t => (t.data.artifact === 'refreshRelapses')).filter(t => t.data.checked).subscribe(d => {
        d.error ? console.log(d.error) : (() => {
          this.isSymptomsChecked = true;
          if (this.relapsisChartLoaded) {
            this.removeChart();
            this.createChart();
          }
        })();
      });

    const subSympUnchecked = this
      .brokerService
      .filterOn(allMessages.neuroRelated)
      .filter(t => (t.data.artifact === 'refreshRelapses')).filter(t => !t.data.checked).subscribe(d => {
        d.error ? console.log(d.error) : (() => {
          this.isSymptomsChecked = false;
          if (this.relapsisChartLoaded) {
            this.removeChart();
            this.createChart();
          }
        })();
      });
    this
      .subscriptions
      .add(sub1)
      .add(sub2)
      .add(sub3)
      .add(sub4)
      .add(putRelapse)
      .add(postRelapse)
      .add(deleteRelapse)
      .add(subSympChecked)
      .add(subSympUnchecked);
  }

  requestForData() {
    this.brokerService.httpGet(allHttpMessages.httpGetRelapse, [
      {
        name: 'pom_id',
        value: this.neuroGraphService.get('queryParams').pom_id
      },
      {
        name: 'startDate',
        value: this.neuroGraphService.moment(this.chartState.dataBufferPeriod.fromDate).format('MM/DD/YYYY')
      },
      {
        name: 'endDate',
        value: this.neuroGraphService.moment(this.chartState.dataBufferPeriod.toDate).format('MM/DD/YYYY')
      }, {
        name: 'randomString',
        value: this.brokerService.generateRandomString()
      }
    ]);
  }

  ngOnDestroy() {
    this
      .subscriptions
      .unsubscribe();
  }

  deleteRelapse() {
    const matched = this.relapsesData.find((obj => obj.relapse_id === this.relapsesDetail.relapse_id));
    const payload = {
      pom_id: this.paramData.pom_id.toString(),
      relapse_id: this.relapsesDetail.relapse_id,
      provider_id: this.paramData.provider_id,
      last_updated_provider_id: this.paramData.provider_id,
      save_csn: this.paramData.csn,
      save_csn_status: this.paramData.csn_status,
      deleted_instant: this.neuroGraphService.moment(new Date()).format('MM/DD/YYYY HH:mm:ss')
    };
    this.brokerService.httpDelete(allHttpMessages.httpDeleteRelapse, payload);
  }

  updateRelapse() {
    if (this.relapsesDetail.year >= new Date().getFullYear() && new Date(this.relapsesDetail.month + '/15/' +
      this.relapsesDetail.year).getMonth() > new Date().getMonth()) {
      this.isDateOutOfRange = true;
    } else {
      const payload = {
        pom_id: this.paramData.pom_id,
        relapse_month: this.relapsesDetail.month,
        relapse_year: this.relapsesDetail.year,
        relapse_id: this.relapsesDetail.relapse_id,
        provider_id: this.paramData.provider_id,
        last_updated_provider_id: this.paramData.provider_id,
        save_csn: this.paramData.csn,
        save_csn_status: this.paramData.csn_status,
        updated_instant: this.neuroGraphService.moment(new Date()).format('MM/DD/YYYY HH:mm:ss'),
        clinician_confirmed: this.relapsesDetail.confirm
      };
      this.brokerService.httpPut(allHttpMessages.httpPutRelapse, payload);
    }
  }

  removeChart() {
    d3.select('#relapses').selectAll('*').remove();
  }

  addRelapse() {
    if (this.relapsesDetail.year >= new Date().getFullYear() && new Date(this.relapsesDetail.month + '/15/' +
      this.relapsesDetail.year).getMonth() > new Date().getMonth()) {
      this.isDateOutOfRange = true;
    } else {
      if (this.relapsesDetail.year !== '' && this.relapsesDetail.month !== '') {
        const payload = {
          pom_id: this.paramData.pom_id,
          relapse_month: this.relapsesDetail.month,
          relapse_year: this.relapsesDetail.year,
          provider_id: this.paramData.provider_id,
          last_updated_provider_id: this.paramData.provider_id,
          save_csn: this.paramData.csn,
          save_csn_status: this.paramData.csn_status,
          updated_instant: this.neuroGraphService.moment(new Date()).format('MM/DD/YYYY HH:mm:ss'),
          patient_qx_reported: false,
          clinician_confirmed: true
        };
        this.brokerService.httpPost(allHttpMessages.httpPostRelapse, payload);
      }
    }
  }

  showSecondLevel(data) {
    this.relapsesDetail = { ...data };

    if (!data.save_csn_status || data.save_csn_status.toUpperCase() !== 'CLOSED') {
      this.isEditSelected = false;
      this.isDateOutOfRange = false;
      const dialogConfig = { hasBackdrop: true, panelClass: 'ns-relapses-theme', width: '405px' };
      this.dialogRef = this.dialog.open(this.relapsesEditSecondLevelTemplate, dialogConfig);
      this.dialogRef.updatePosition({ top: `${d3.event.clientY - 140}px`, left: `${d3.event.clientX - 202}px` });

    } else {
      const dialogConfig = { hasBackdrop: true, panelClass: 'ns-relapses-theme', width: '350px' };
      this.dialogRef = this.dialog.open(this.relapsesSecondLevelTemplate, dialogConfig);
      this.dialogRef.updatePosition({ top: `${d3.event.clientY - 130}px`, left: `${d3.event.clientX - 175}px` });
    }
  }

  checkChge() {
    if (this.relapsesDetail.confirm) {
      this.relapsesDetail.confirm = false;
    } else {
      this.relapsesDetail.confirm = true;
    }
    this.isEditSelected = true;
  }

  valChng() {
    this.isEditSelected = true;
    this.isDateOutOfRange = false;
  }

  addChng() {
    this.isDateOutOfRange = false;
  }

  createChart() {
    this.datasetB = this.relapsesData.map(d => {
      const relMonth = this.month.indexOf(d.relapse_month);
      const relYear = parseInt(d.relapse_year, 10);
      return {
        ...d,
        last_updated_instant: d.relapse_month + '/15/' + d.relapse_year,
        lastUpdatedDate: new Date(relYear, relMonth, 15),
        confirm: d.clinician_confirmed && d.clinician_confirmed.toString().toUpperCase() === 'TRUE',
        month: d.relapse_month,
        year: d.relapse_year
      };
    }).sort((a, b) => a.lastUpdatedDate - b.lastUpdatedDate);

    const element = d3.select('#relapses');
    this.width = GRAPH_SETTINGS.panel.offsetWidth - GRAPH_SETTINGS.panel.marginLeft - GRAPH_SETTINGS.panel.marginRight;
    this.height = GRAPH_SETTINGS.panel.offsetHeight - GRAPH_SETTINGS.panel.marginTop - GRAPH_SETTINGS.panel.marginBottom;

    this.yScale = d3
      .scaleLinear()
      .domain(this.yDomain)
      .range([GRAPH_SETTINGS.relapse.chartHeight - 20, 0]);

    this.line = d3.line<any>()
      .x((d: any) => this.chartState.xScale(d.lastUpdatedDate))
      .y((d: any) => 0);

    d3.select('#relapses')
      .append('clipPath')
      .attr('id', 'relapses-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', -GRAPH_SETTINGS.relapse.chartHeight / 2)
      .attr('width', this.chartState.canvasDimension.width)
      .attr('height', GRAPH_SETTINGS.relapse.chartHeight);

    this.chart = d3.select('#relapses')
      .append('g')
      .attr('transform', 'translate(' + GRAPH_SETTINGS.panel.marginLeft + ',' + GRAPH_SETTINGS.relapse.positionTop + ')')
      .attr('clip-path', 'url(#relapses-clip)');

    if (!this.isSymptomsChecked) {
      this.pathUpdate = this.chart.append('path')
        .datum([
          { 'lastUpdatedDate': this.chartState.xDomain.currentMinValue },
          { 'lastUpdatedDate': this.chartState.xDomain.currentMaxValue }
        ])
        .attr('class', 'line')
        .attr('d', this.line)
        .attr('stroke', 'red')
        .attr('stroke-width', '1.5')
        .attr('fill', 'none');

    }


    const arc = d3.symbol().type(d3.symbolTriangle).size(100);
    this.chart.selectAll('.triangle')
      .data(this.datasetB)
      .enter().append('path')
      .attr('d', arc)
      .attr('class', 'triangle')
      .style('cursor', 'pointer')
      .attr('transform', d => {
        return `translate(${(this.chartState.xScale(d.lastUpdatedDate))},0) rotate(180)`;
      })
      .style('stroke', 'red')
      .style('fill', d => {
        return d.confirm ? 'red' : '#fff';
      })
      .on('click', d => {
        this.showSecondLevel(d);
      });

  }
}
