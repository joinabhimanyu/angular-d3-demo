import {
  Component,
  OnInit,
  OnDestroy,
  Input,
  ViewChild,
  TemplateRef,
  Inject,
  ViewEncapsulation
} from '@angular/core';
import { MatDialog, MatDialogRef } from '@angular/material';
import * as d3 from 'd3';
import { BrokerService } from '../../broker/broker.service';
import { NeuroGraphService } from '../../neuro-graph.service';
import { allMessages, allHttpMessages, GRAPH_SETTINGS, edssScoreChart } from '../../neuro-graph.config';

@Component({
  selector: 'app-edss,[app-edss]',
  templateUrl: './edss.component.html',
  styleUrls: ['./edss.component.scss'],
  encapsulation: ViewEncapsulation.None
})

export class EdssComponent implements OnInit, OnDestroy {
  @Input() chartState: any;
  @ViewChild('edssSecondLevelTemplate') edssSecondLevelTemplate: TemplateRef<any>;
  @ViewChild('edssScoreChartTemplate') edssScoreChartTemplate: TemplateRef<any>;
  subscriptions: any;
  queryStringParams: any;
  secondLayerDialogRef: MatDialogRef<any>;
  scoreChartDialogRef: MatDialogRef<any>;
  edssChartLoaded: boolean = false;
  virtualCaseloadLoaded: boolean = false;
  edssScoreDetail: any;
  yScale: any;
  yDomain: Array<number> = [0, GRAPH_SETTINGS.edss.maxValueY];
  clinicianDataSet: Array<any> = [];
  patientDataSet: Array<any> = [];
  edssPopupQuestions: any = [];
  scoreChartOpType: any;
  edssVirtualLoadData: Array<any>;
  edssVirtualLoadDataq1: Array<any>;
  edssVirtualLoadDataq2: Array<any>;
  edssVirtualLoadDataq3: Array<any>;
  edssVirtualLoadDataq4: Array<any>;
  edssVirtualLoadDatam: Array<any>;
  edssVirtualLoadDataLength: number;
  datasetArea1: Array<any> = [];
  datasetArea2: Array<any> = [];
  datasetMean: Array<any> = [];
  edssOpenAddPopUp: boolean = false;
  registerDrag: any;
  addScoreError: boolean = false;

  constructor(private brokerService: BrokerService, private dialog: MatDialog, private neuroGraphService: NeuroGraphService) {
    this.registerDrag = e => neuroGraphService.registerDrag(e);
    this.queryStringParams = this.neuroGraphService.get('queryParams');
  }

  ngOnInit() {
    this.edssPopupQuestions = edssScoreChart;
    this.edssPopupQuestions.map(x => x.checked = false);

    const obsEdss = this
      .brokerService
      .filterOn(allMessages.neuroRelated)
      .filter(t => (t.data.artifact === 'edss'));
    const sub0 = obsEdss
      .filter(t => t.data.checked)
      .subscribe(d => {
        d.error
          ? (() => {
            console.log(d.error);
          })()
          : (() => {
            this.requestForEdssData();
          })();
      });

    const sub1 = obsEdss
      .filter(t => !t.data.checked)
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : (() => {
            this.unloadChart();
            this.edssChartLoaded = false;
          })();
      });

    const sub2 = this
      .brokerService
      .filterOn(allMessages.invokeAddEdss)
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : (() => {
            const dt = d3.selectAll('.edss-charts');
            if (dt['_groups'][0].length === 0) {
              this.edssOpenAddPopUp = true;
              this
                .brokerService
                .emit(allMessages.neuroRelated, {
                  artifact: 'edss',
                  checked: true
                });
            } else {
              this.addScoreError = false;
              this.scoreChartOpType = 'Add';
              const dialogConfig = {
                hasBackdrop: true,
                panelClass: 'ns-edss-theme',
                width: '670px',
                height: '675px'
              };
              this.scoreChartDialogRef = this
                .dialog
                .open(this.edssScoreChartTemplate, dialogConfig);
              this
                .scoreChartDialogRef
                .updatePosition({ top: '65px', left: '60px' });
            }
          })();
      });

    const sub3 = this
      .brokerService
      .filterOn(allMessages.toggleVirtualCaseload)
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : (() => {
            if (d.data.artifact === 'add') {
              this
                .brokerService
                .httpGet(allHttpMessages.httpGetVirtualCaseLoad, [
                  {
                    name: 'pom_id',
                    value: this.neuroGraphService.get('queryParams').pom_id
                  },
                  {
                    name: 'start_year',
                    value: this.chartState.dataBufferPeriod.fromDate.getFullYear()
                  },
                  {
                    name: 'end_year',
                    value: this.chartState.dataBufferPeriod.toDate.getFullYear()
                  },
                  {
                    name: 'randomString',
                    value: this.brokerService.generateRandomString()
                  }
                ]);

            } else {
              this.virtualCaseloadLoaded = false;
              this.removeChart();
              this.drawEdssLineCharts();
            }
          })();
      });

    const sub4 = this
      .brokerService
      .filterOn('FETCH_EDSS_QUES')
      .subscribe(d => {
        d.error
          ? (() => {
            console.log(d.error);
            this.brokerService.emit(allMessages.checkboxEnable, 'edss');
          })()
          : (() => {
            try {
              this.unloadChart();
              const edssData = d.data[0][allHttpMessages.httpGetEdss].edss_scores;
              const quesData = d.data[1][allHttpMessages.httpGetAllQuestionnaire].questionnaires;
              const getParsedDate = (dtString) => {
                const dtPart = dtString.split(' ')[0];
                return Date.parse(dtPart);
              };
              if (edssData) {
                this.clinicianDataSet = edssData.map(inner => {
                  const scoreValue = inner.score ? parseFloat(inner.score) : 0;
                  return {
                    ...inner,
                    lastUpdatedDate: getParsedDate(inner.last_updated_instant
                      || this.neuroGraphService.moment(inner['last_updated_instant']).format('MM/DD/YYYY')),
                    reportedBy: 'Clinician',
                    scoreValue: isNaN(scoreValue) ? 0 : scoreValue
                  };
                }).sort((a, b) => a.lastUpdatedDate - b.lastUpdatedDate);
              }
              // filter on whose qx_code is not present (clinician reported data)
              this.clinicianDataSet = this.clinicianDataSet.filter(inner => !inner.qx_code);
              if (quesData) {
                this.patientDataSet = quesData.map(inner => {
                  const scoreValue = inner.edss_score ? parseFloat(inner.edss_score) : 0;
                  return {
                    ...inner,
                    symptoms: inner.symptoms ? JSON.parse(inner.symptoms) : [],
                    lastUpdatedDate: getParsedDate(inner.qx_completed_at
                      || this.neuroGraphService.moment(inner['qx_completed_at']).format('MM/DD/YYYY')),
                    reportedBy: 'Patient',
                    scoreValue: isNaN(scoreValue) ? 0 : scoreValue
                  };
                }).sort((a, b) => a.lastUpdatedDate - b.lastUpdatedDate);
                // filter on whose symptoms are present
                this.patientDataSet = this.patientDataSet.filter(inner => inner.symptoms && inner.symptoms.length > 0);
              }

              if (this.clinicianDataSet && this.patientDataSet) {
                this.drawEdssYAxis();
                this.drawEdssLineCharts();
              }

              this.edssChartLoaded = true;
              if (this.edssOpenAddPopUp === true) {
                this.edssOpenAddPopUp = false;
                const dt = d3.selectAll('.edss-charts');
                if (dt['_groups'][0].length > 0) {
                  this.scoreChartOpType = 'Add';
                  const dialogConfig = {
                    hasBackdrop: true,
                    panelClass: 'ns-edss-theme',
                    width: '670px',
                    height: '675px'
                  };
                  this.scoreChartDialogRef = this
                    .dialog
                    .open(this.edssScoreChartTemplate, dialogConfig);
                  this
                    .scoreChartDialogRef
                    .updatePosition({ top: '65px', left: '60px' });
                }
              }
              this.brokerService.emit(allMessages.checkboxEnable, 'edss');

              let ErrorCode: string = '';
              // filter with current csn and check condition
              const csn = this.neuroGraphService.get('queryParams').csn;
              const filter = quesData.filter(x => (x.qx_appt_csn || '').toLowerCase() === (csn || '').toLowerCase());
              if (!filter || filter.some(m => (m.status ? m.status.toUpperCase() : '') !== 'COMPLETED')) {
                ErrorCode = ErrorCode.indexOf('U-004') !== -1 ? ErrorCode : ErrorCode === '' ? 'U-004' : ErrorCode + ',' + 'U-004';
              }
              if (filter && filter.some(m => isNaN(parseFloat(m.edss_score || '')))) {
                ErrorCode = ErrorCode.indexOf('D-002') !== -1 ? ErrorCode : ErrorCode === '' ? 'D-002' : ErrorCode + ',' + 'D-002';
              }
              if (edssData && edssData.some(m => isNaN(parseFloat(m.score || '')))) {
                ErrorCode = ErrorCode.indexOf('D-002') !== -1 ? ErrorCode : ErrorCode === '' ? 'D-002' : ErrorCode + ',' + 'D-002';
              }
              if (ErrorCode !== '') {
                this.brokerService.emit(allMessages.showCustomError, ErrorCode);
              }
            } catch (ex) {
              console.log(ex);
              this.brokerService.emit(allMessages.checkboxEnable, 'edss');
              this.brokerService.emit(allMessages.showLogicalError, 'EDSS');
            }
          })();
      });

    const sub5 = this
      .brokerService
      .filterOn(allHttpMessages.httpGetVirtualCaseLoad)
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : (() => {
            try {
              if (d.data && d.data[0] && d.data[0].edss) {
                this.edssVirtualLoadData = d.data[0].edss;
                this.edssVirtualLoadDataLength = d.data[0].edss.q1.length;
                this.edssVirtualLoadDataq1 = d.data[0].edss.q1;
                this.edssVirtualLoadDataq2 = d.data[0].edss.q2;
                this.edssVirtualLoadDataq3 = d.data[0].edss.q3;
                this.edssVirtualLoadDataq4 = d.data[0].edss.q4;
                this.edssVirtualLoadDatam = d.data[0].edss.m;
                this.removeChart();
                this.drawVirtualCaseload();
                this.drawEdssLineCharts();
                this.virtualCaseloadLoaded = true;
              } else if (d.data && d.data.data_unavailable === 'true') {
                this.brokerService.emit(allMessages.showCustomError, 'M-003');
              } else {
                this.brokerService.emit(allMessages.showCustomError, 'M-002');
              }
            } catch (ex) {
              console.log(ex);
              this.brokerService.emit(allMessages.showLogicalError, 'population');
            }
          })();
      });

    const sub6 = this
      .brokerService
      .filterOn(allMessages.graphScaleUpdated)
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : (() => {
            if (this.edssChartLoaded) {
              if (d.data.fetchData) {
                this.unloadChart();
                this.brokerService.emit(allMessages.neuroRelated, { artifact: 'edss', checked: true });
                if (this.virtualCaseloadLoaded) {
                  this.brokerService.emit(allMessages.toggleVirtualCaseload, { artifact: 'add' });
                }
              } else {
                this.reloadChart();
              }
            }
          })();
      });
    const sub7 = this
      .brokerService
      .filterOn(allHttpMessages.httpPostEdss)
      .subscribe(d => {
        d.error ? console.log(d.error) : (() => {
          this.requestForEdssData();
        })();
      });

    const sub8 = this
      .brokerService
      .filterOn(allHttpMessages.httpPutEdss)
      .subscribe(d => {
        d.error ? console.log(d.error) : (() => {
          this.secondLayerDialogRef.close();
          this.requestForEdssData();
        })();
      });

    this.subscriptions = sub0
      .add(sub1)
      .add(sub2)
      .add(sub3)
      .add(sub4)
      .add(sub5)
      .add(sub6)
      .add(sub7)
      .add(sub8);
  }

  requestForEdssData() {
    this.brokerService.httpGetMany('FETCH_EDSS_QUES', [
      {
        urlId: allHttpMessages.httpGetEdss,
        queryParams: [
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
          },
          {
            name: 'randomString',
            value: this.brokerService.generateRandomString()
          }
        ]
      }, {
        urlId: allHttpMessages.httpGetAllQuestionnaire,
        queryParams: [
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
          },
          {
            name: 'randomString',
            value: this.brokerService.generateRandomString()
          }
        ]
      }
    ]);
  }

  ngOnDestroy() {
    this
      .subscriptions
      .unsubscribe();
  }

  onSelectChartScore(index) {
    this
      .edssPopupQuestions
      .forEach(q => {
        q.checked = false;
      });
    this.edssPopupQuestions[index].checked = true;
  }

  onSubmitChartScore(event) {
    const selectedScore = this
      .edssPopupQuestions
      .find(x => x.checked === true);
    if (!selectedScore) {
      event.stopPropagation();
      return;
    };
    if (this.scoreChartOpType === 'Add') {
      const today = new Date();
      const scoreOnThisDate = this.clinicianDataSet.find(s => {
        const scoreDt = new Date(s.lastUpdatedDate);
        return scoreDt.getFullYear() === today.getFullYear()
          && scoreDt.getMonth() === today.getMonth()
          && scoreDt.getDate() === today.getDate();
      });

      if (!scoreOnThisDate) {
        this.addScoreError = false;
        const payload: any = {
          score: selectedScore.score.toString(),
          pom_id: this.queryStringParams.pom_id,
          provider_id: this.queryStringParams.provider_id,
          save_csn: this.queryStringParams.csn,
          save_csn_status: this.queryStringParams.csn_status,
          last_updated_instant: this.neuroGraphService.moment(new Date()).format('MM/DD/YYYY HH:mm:ss')
        };
        this.brokerService.httpPost(allHttpMessages.httpPostEdss, payload);
        this.scoreChartDialogRef.close();
      } else {
        this.addScoreError = true;
      }
    } else {
      if (this.edssScoreDetail.score !== selectedScore.score) {
        this.edssScoreDetail.score = selectedScore.score;
        this.edssScoreDetail.scoreValue = parseFloat(selectedScore.score);
        this.edssScoreDetail.showUpdate = true;
      } else {
        this.edssScoreDetail.showUpdate = false;
      }
      this.showSecondLevel(this.edssScoreDetail);
      this.scoreChartDialogRef.close();
    }
  }

  onClickSecondLayerScore() {
    this.addScoreError = false;
    this.scoreChartOpType = 'Update';
    this
      .secondLayerDialogRef
      .close();
    setTimeout(() => {
      const dialogConfig = {
        hasBackdrop: true,
        panelClass: 'ns-edss-theme',
        width: '670px',
        height: '675px'
      };
      this.scoreChartDialogRef = this
        .dialog
        .open(this.edssScoreChartTemplate, dialogConfig);
      this
        .scoreChartDialogRef
        .updatePosition({ top: '65px', left: '60px' });
    }, 500);
  }

  onUpdateSecondLayer() {
    const payload: any = {
      score_id: this.edssScoreDetail.score_id,
      score: this.edssScoreDetail.score.toString(),
      last_updated_instant: this.edssScoreDetail.last_updated_instant,
      pom_id: this.queryStringParams.pom_id,
      provider_id: this.queryStringParams.provider_id,
      save_csn: this.queryStringParams.csn,
      save_csn_status: this.queryStringParams.csn_status
    };
    this.brokerService.httpPut(allHttpMessages.httpPutEdss, payload);
  }

  showSecondLevel(data) {
    this.dialog.openDialogs.pop();
    const config = {
      hasBackdrop: true,
      panelClass: 'ns-edss-theme',
      width: '200px'
    };
    this.edssScoreDetail = { ...data };
    this.secondLayerDialogRef = this.dialog.open(this.edssSecondLevelTemplate, config);
    if (d3.event) {
      this.secondLayerDialogRef.updatePosition({ top: `${d3.event.clientY - 150}px`, left: `${d3.event.clientX - 100}px` });
    }
  }

  drawEdssYAxis() {
    this.yScale = d3
      .scaleLinear()
      .domain(this.yDomain)
      .range([
        GRAPH_SETTINGS.edss.chartHeight - 20,
        0
      ]);
    const svg = d3
      .select('#edss')
      .append('g')
      .attr('class', 'edss-axis')
      .attr('transform', `translate(${GRAPH_SETTINGS.panel.marginLeft},${GRAPH_SETTINGS.edss.positionTop})`);

    const xAxisGridLines = d3
      .axisLeft(this.yScale)
      .tickSize(0);
    const oneDecimalFormat = d3.format('.1f');

    svg
      .append('g')
      .attr('class', 'edss-y-axis')
      .call(g => {
        const yAxis = g.call(d3.axisLeft(this.yScale).tickFormat(oneDecimalFormat));
        g
          .select('.domain')
          .remove();
        yAxis
          .selectAll('line')
          .style('display', 'none');
        yAxis
          .selectAll('text')
          .attr('x', '-5')
          .attr('fill', GRAPH_SETTINGS.edss.color)
          .style('font-size', '1.2em')
          .style('font-weight', 'bold');
      });

    const axisText = svg
      .append('text')
      .attr('y', -25)
      .style('font-weight', 'bold')
      .style('font-size', '10px');
    axisText
      .append('tspan')
      .attr('x', -GRAPH_SETTINGS.panel.marginLeft)
      .attr('dy', 0)
      .text('EDSS');
    axisText
      .append('tspan')
      .attr('x', -GRAPH_SETTINGS.panel.marginLeft)
      .attr('dy', 10)
      .text('Score');

    svg
      .append('g')
      .attr('class', 'horizontal-grid-lines')
      .call(g => {
        const axis = g.call(xAxisGridLines);
        axis.selectAll('line')
          .style('stroke', '#f0f0f0');
        axis.selectAll('line')
          .style('stroke-width', '1px');
        axis
          .select('.domain')
          .remove();
        axis
          .selectAll('text')
          .remove();
        axis
          .selectAll('line')
          .attr('x2', (d) => {
            return (this.chartState.canvasDimension.offsetWidth - 45);
          });
      });
  }

  drawEdssLineCharts() {
    const oneDecimalFormat = d3.format('.1f');
    const line = d3.line<any>().x((d: any) => this.chartState.xScale(d.lastUpdatedDate)).y((d: any) => this.yScale(d.scoreValue));
    d3
      .select('#edss')
      .append('clipPath')
      .attr('id', 'edss-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', -40)
      .attr('width', this.chartState.canvasDimension.width)
      .attr('height', GRAPH_SETTINGS.edss.chartHeight + 40);

    const svg = d3
      .select('#edss')
      .append('g')
      .attr('class', 'edss-charts')
      .attr('transform', `translate(${GRAPH_SETTINGS.panel.marginLeft},${GRAPH_SETTINGS.edss.positionTop})`)
      .attr('clip-path', 'url(#edss-clip)');
    svg
      .selectAll('.dot-clinician')
      .data(this.clinicianDataSet)
      .enter()
      .append('circle')
      .attr('class', 'dot-clinician')
      .attr('cx', d => this.chartState.xScale(d.lastUpdatedDate || ''))
      .attr('cy', d => this.yScale(d.scoreValue || 0))
      .attr('r', 7)
      .style('fill', GRAPH_SETTINGS.edss.color)
      .style('cursor', 'pointer')
      .on('mouseover', d => {
        const match = this
          .patientDataSet
          .find(itm => {
            const cDt = itm.qx_completed_at ? this.neuroGraphService.moment(itm.qx_completed_at, 'MM/DD/YYYY') : '';
            const pDt = d.last_updated_instant ? this.neuroGraphService.moment(d.last_updated_instant, 'MM/DD/YYYY') : '';
            return parseFloat(itm.edss_score || 0) === parseFloat(d.score || 0) && cDt === pDt;
            // const cDt = new Date(itm.qx_completed_at);
            // const pDt = new Date(d.last_updated_instant);
            // return parseFloat(itm.edss_score) === parseFloat(d.score) && pDt.getDate() === cDt.getDate() &&
            //   pDt.getMonth() === cDt.getMonth() && pDt.getFullYear() === cDt.getFullYear();
          });
        if (match) {
          d.reportedBy = 'Patient and Clinician';
        }
        d.allowEdit = !d.save_csn_status || d.save_csn_status.toUpperCase() !== 'CLOSED';
        this.showSecondLevel(d);
      });
    const labels1 = svg
      .selectAll('.label-clinician')
      .data(this.clinicianDataSet)
      .enter()
      .append('text')
      .attr('class', 'label-clinician')
      .style('font-size', '10px')
      .attr('x', d => this.chartState.xScale(d.lastUpdatedDate || '') - 7)
      .attr('y', d => this.yScale(d.scoreValue || 0) - 10)
      .text(d => oneDecimalFormat(d.scoreValue || 0));
    svg
      .append('path')
      .datum(this.patientDataSet)
      .attr('class', 'line')
      .style('fill', 'none')
      .style('stroke', GRAPH_SETTINGS.edss.color)
      .style('stroke-width', '1')
      .attr('d', line);
    svg
      .selectAll('.dot-patient')
      .data(this.patientDataSet)
      .enter()
      .append('circle')
      .attr('class', 'dot-patient')
      .attr('cx', d => this.chartState.xScale(d.lastUpdatedDate || ''))
      .attr('cy', d => this.yScale(d.scoreValue || 0))
      .attr('r', 7)
      .style('fill', GRAPH_SETTINGS.edss.color)
      .style('cursor', 'pointer')
      .on('mouseover', d => {
        this.showSecondLevel(d);
      });
    const labels2 = svg
      .selectAll('.label-patient')
      .data(this.patientDataSet)
      .enter()
      .append('text')
      .attr('class', 'label-patient')
      .style('font-size', '10px')
      .attr('x', d => this.chartState.xScale(d.lastUpdatedDate || '') - 7)
      .attr('y', d => this.yScale(d.scoreValue || 0) - 10)
      .text(d => oneDecimalFormat(d.scoreValue || 0));
    this.arrangeLabels(labels1, labels2);
  }

  arrangeLabels(labels1, labels2) {
    labels1.each((d1, i, currentNodes) => {
      const current = currentNodes[i];
      let y1 = parseFloat(current.getAttribute('y'));
      const x1 = parseFloat(current.getAttribute('x'));
      const textLength1 = current.textContent.length * 5;
      labels2.each((d2, j, nextNodes) => {
        const next = nextNodes[j];
        if (current !== next) {
          const x2 = parseFloat(next.getAttribute('x'));
          const y2 = parseFloat(next.getAttribute('y'));
          const textLength2 = next.textContent.length * 5;
          if ((Math.abs(x1 - x2) < Math.abs(textLength1)) && (Math.abs(y1) === Math.abs(y2))) {
            next.setAttribute('y', (y2 - 2).toString());
            current.setAttribute('y', (y2 + 28).toString());
            y1 = parseFloat(next.getAttribute('y'));
          }
        }
      });
    });
  }

  drawVirtualCaseload() {
    this.datasetArea1 = [];
    this.datasetArea2 = [];
    this.datasetMean = [];
    const line = d3.line<any>().x((d: any) => this.chartState.xScale(d.lastUpdatedDate)).y((d: any) => this.yScale(d.scoreValue));
    const svg = d3
      .select('#edss')
      .append('g')
      .attr('clip-path', 'url(#edss-clip)')
      .attr('class', 'edss-charts')
      .attr('transform', `translate(${GRAPH_SETTINGS.panel.marginLeft},${GRAPH_SETTINGS.edss.positionTop})`);
    this.datasetArea1
      .push({ xDate: this.chartState.xDomain.currentMinValue, q2: this.edssVirtualLoadDataq2[0], q3: this.edssVirtualLoadDataq3[0] });
    this.datasetArea2
      .push({ xDate: this.chartState.xDomain.currentMinValue, q1: this.edssVirtualLoadDataq1[0], q4: this.edssVirtualLoadDataq4[0] });
    this.datasetMean
      .push({ xDate: this.chartState.xDomain.currentMinValue, m: this.edssVirtualLoadDatam[0] });

    for (let i = 0; i < this.edssVirtualLoadDataLength; i++) {
      const scaleMinYear = this.chartState.xDomain.currentMinValue.getFullYear();
      let date = new Date(scaleMinYear, 5, 30).getTime();
      if (i === 1) {
        date = new Date(scaleMinYear + 1, 5, 30).getTime();
      } else if (i === 2) {
        date = new Date(scaleMinYear + 2, 5, 30).getTime();
      }
      this.datasetArea1
        .push({ xDate: date, q2: this.edssVirtualLoadDataq2[i], q3: this.edssVirtualLoadDataq3[i] });
      this.datasetArea2
        .push({ xDate: date, q1: this.edssVirtualLoadDataq1[i], q4: this.edssVirtualLoadDataq4[i] });
      this.datasetMean
        .push({ xDate: date, m: this.edssVirtualLoadDatam[i] });
    }

    this.datasetArea1
      .push({
        xDate: this.chartState.xDomain.currentMaxValue,
        q2: this.edssVirtualLoadDataq2[this.edssVirtualLoadDataLength - 1],
        q3: this.edssVirtualLoadDataq3[this.edssVirtualLoadDataLength - 1]
      });

    this.datasetArea2
      .push({
        xDate: this.chartState.xDomain.currentMaxValue,
        q1: this.edssVirtualLoadDataq1[this.edssVirtualLoadDataLength - 1],
        q4: this.edssVirtualLoadDataq4[this.edssVirtualLoadDataLength - 1]
      });

    this
      .datasetMean
      .push({
        xDate: this.chartState.xDomain.currentMaxValue,
        m: this.edssVirtualLoadDatam[this.edssVirtualLoadDataLength - 1]
      });

    const lineMean = d3.line<any>().x((d: any) => this.chartState.xScale(d.xDate)).y((d: any) => this.yScale(d.m));

    const area1 = d3
      .area()
      .x((d: any) => this.chartState.xScale(d.xDate))
      .y0((d: any) => this.yScale(d.q2))
      .y1((d: any) => this.yScale(d.q3));

    const area2 = d3
      .area()
      .x((d: any) => this.chartState.xScale(d.xDate))
      .y0((d: any) => this.yScale(d.q1))
      .y1((d: any) => this.yScale(d.q4));

    svg
      .append('path')
      .datum(this.datasetArea2)
      .attr('fill', 'lightgrey')
      .attr('d', area2);

    svg
      .append('path')
      .datum(this.datasetArea1)
      .attr('fill', 'darkgrey')
      .attr('d', area1);

    svg
      .append('path')
      .datum(this.datasetMean)
      .attr('class', 'line')
      .style('fill', 'none')
      .style('stroke', 'white')
      .style('stroke-width', '1')
      .attr('d', lineMean);
  }

  removeChart() {
    d3
      .selectAll('.edss-charts')
      .remove();
  }

  unloadChart() {
    d3
      .select('#edss')
      .selectAll('*')
      .remove();
  }

  reloadChart() {
    if (this.edssChartLoaded) {
      this.unloadChart();
      this.drawEdssYAxis();
      if (this.virtualCaseloadLoaded) {
        this.drawVirtualCaseload();
      }
      this.drawEdssLineCharts();
    }
  }
}
