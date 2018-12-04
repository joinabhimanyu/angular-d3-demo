import { Component, OnInit, Input, ViewChild, TemplateRef, Inject, ViewEncapsulation } from '@angular/core';
import * as d3 from 'd3';
import { BrokerService } from '../../broker/broker.service';
import { allMessages, allHttpMessages } from '../../neuro-graph.config';
import { GRAPH_SETTINGS } from '../../neuro-graph.config';
import { MdDialog, MdDialogRef } from '@angular/material';
import { NeuroGraphService } from '../../neuro-graph.service';

@Component({
  selector: 'app-twenty-five-foot-walk,[app-twenty-five-foot-walk]',
  templateUrl: './twenty-five-foot-walk.component.html',
  styleUrls: ['./twenty-five-foot-walk.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class TwentyFiveFootWalkComponent implements OnInit {
  @ViewChild('walk25FeetSecondLevelTemplate') private walk25FeetSecondLevelTemplate: TemplateRef<any>;
  @ViewChild('walk25FeetEditSecondLevelTemplate') private walk25FeetEditSecondLevelTemplate: TemplateRef<any>;
  @ViewChild('walk25FeetAddSecondLevelTemplate') private walk25FeetAddSecondLevelTemplate: TemplateRef<any>;
  @ViewChild('walk25FeetThirdLevelTemplate') private walk25FeetThirdLevelTemplate: TemplateRef<any>;

  @Input() private chartState: any;
  private dialogRef: MdDialogRef<any>;
  private Walk25FeetChartDialogRef: MdDialogRef<any>;
  private walk25FeetScoreDetail: any;
  private subscriptions: any;
  private yScale: any;
  private yDomain: Array<number> = [0, GRAPH_SETTINGS.walk25Feet.maxValueY];
  private walk25FeetData: Array<any> = [];
  private walk25FeetDataInfo: Array<any> = [];
  private reportDialogRef: MdDialogRef<any>;
  private showUpdate: Boolean = false;
  private score_1: any;
  private score_2: any;
  private scoreValue: any;
  private scoreNotValidate: any;
  private scoreNotSamedate: any;
  private Feet25WalkChartLoaded: boolean = false;
  private walk25FeetOpenAddPopUp: boolean = false;

  registerDrag: any;
  constructor(private brokerService: BrokerService, private dialog: MdDialog, private neuroGraphService: NeuroGraphService) {
    this.registerDrag = e => neuroGraphService.registerDrag(e);

  }
  ngOnInit() {
    this.subscriptions = this
      .brokerService
      .filterOn(allHttpMessages.httpGetWalk25Feet)
      .subscribe(d => {
        d.error ? (() => {
          console.log(d.error);
          this.brokerService.emit(allMessages.checkboxEnable, 'walk25Feet');
        })()
          : (() => {

            try {
              this.walk25FeetData = d.data['25fw_scores'];
              if (this.walk25FeetData && this.walk25FeetData.length > 0) {
                this.unloadChart();
                this.drawWalk25FeetAxis();
                this.drawWalk25FeetLineCharts();
              } else {
                this.walk25FeetData = [];
              }
              this.Feet25WalkChartLoaded = true;
              if (this.walk25FeetOpenAddPopUp === true) {
                this.walk25FeetOpenAddPopUp = false;
                const dt = d3.selectAll('.walk25Feet-axis');
                this.score_1 = '';
                this.score_2 = '';
                this.scoreValue = '';
                const dialogConfig = {
                  hasBackdrop: true, panelClass: 'ns-25walk-theme', width: '225px',
                  preserveScope: true, skipHide: true
                };
                this.Walk25FeetChartDialogRef = this.dialog.open(this.walk25FeetAddSecondLevelTemplate, dialogConfig);
                this.Walk25FeetChartDialogRef.updatePosition({ top: '325px', left: '255px' });
              }
              this.brokerService.emit(allMessages.checkboxEnable, 'walk25Feet');
              if (this.walk25FeetData && this.walk25FeetData.length > 0 &&
                this.walk25FeetData.some(obj => obj.walk_1_score === '' || obj.walk_2_score === ''
                  || obj.walk_1_score === 'No result' || obj.walk_2_score === 'No result')) {
                this.brokerService.emit(allMessages.showCustomError, 'D-002');
              }
            } catch (ex) {
              console.log(ex);
              this.brokerService.emit(allMessages.showLogicalError, 'walk25Feet');
              this.brokerService.emit(allMessages.checkboxEnable, 'walk25Feet');
            }
          })();
      });
    const walk25Feet = this
      .brokerService
      .filterOn(allMessages.neuroRelated)
      .filter(t => (t.data.artifact === 'walk25Feet'));

    const modal = this.brokerService.filterOn(allMessages.invokeAddWalk25Feet);

    const sub1 = walk25Feet.filter(t => t.data.checked).subscribe(d => {
      d.error ? (() => {
        console.log(d.error);
      }) : (() => {
        this.get25FeetWalkData();
      })();
    });
    const sub2 = walk25Feet.filter(t => !t.data.checked).subscribe(d => {
      d.error ? console.log(d.error) : (() => {
        this.unloadChart();
        this.Feet25WalkChartLoaded = false;
      })();
    });
    const sub3 = modal.subscribe(d => {
      d.error ? console.log(d.error) : (() => {
        const dt = d3.selectAll('.walk25Feet-axis');
        this.scoreNotValidate = false;
        this.scoreNotSamedate = false;
        if (dt['_groups'][0].length === 0) {
          this.walk25FeetOpenAddPopUp = true;
          this
            .brokerService
            .emit(allMessages.neuroRelated, {
              artifact: 'walk25Feet',
              checked: true
            });
        } else {
          this.score_1 = '';
          this.score_2 = '';
          this.scoreValue = '';
          const dialogConfig = { hasBackdrop: true, panelClass: 'ns-25walk-theme', width: '225px', preserveScope: true, skipHide: true };
          this.Walk25FeetChartDialogRef = this.dialog.open(this.walk25FeetAddSecondLevelTemplate, dialogConfig);
          this.Walk25FeetChartDialogRef.updatePosition({ top: '325px', left: '255px' });
        }

      })();
    });
    const sub4 = this.brokerService.filterOn(allHttpMessages.httpGetWalk25FeetInfo).subscribe(d => {
      d.error ? console.log(d.error) : (() => {
        this.walk25FeetDataInfo = d.data;


      })();
    });

    const sub5 = this.brokerService.filterOn(allMessages.graphScaleUpdated).subscribe(d => {
      d.error ? console.log(d.error) : (() => {
        if (this.Feet25WalkChartLoaded) {
          if (d.data.fetchData) {
            this.unloadChart();
            this.brokerService.emit(allMessages.neuroRelated, { artifact: 'walk25Feet', checked: true });
          } else {
            this.unloadChart();
            this.drawWalk25FeetAxis();
            this.drawWalk25FeetLineCharts();
          }
        }
      })();
    });

    const sub6 = this
      .brokerService
      .filterOn(allHttpMessages.httpPostWalk25Feet)
      .subscribe(d => {
        d.error ? console.log(d.error) : (() => {
          try {
            this.Walk25FeetChartDialogRef.close();
            this.removeChart();
            this.get25FeetWalkData();
          } catch (ex) {
            console.log(ex);
            this.brokerService.emit(allMessages.showLogicalError, 'walk25Feet');
          }
        })();
      });

    const sub7 = this
      .brokerService
      .filterOn(allHttpMessages.httpPutWalk25Feet)
      .subscribe(d => {
        d.error ? console.log(d.error) : (() => {
          try {
            this.dialogRef.close();
            this.removeChart();
            this.get25FeetWalkData();
          } catch (ex) {
            console.log(ex);
            this.brokerService.emit(allMessages.showLogicalError, 'walk25Feet');
          }
        })();
      });

    const info = this.brokerService.httpGet(allHttpMessages.httpGetWalk25FeetInfo);
    this.subscriptions
      .add(sub1)
      .add(sub2)
      .add(sub3)
      .add(sub4)
      .add(sub5)
      .add(sub6)
      .add(sub7);
  }
  get25FeetWalkData() {
    this.brokerService.httpGet(allHttpMessages.httpGetWalk25Feet, [
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
    ]);
  }
  updateWalk(str) {
    if (str === 'Update') {
      if (this.walk25FeetScoreDetail.walk_1_score === '' ||
        this.walk25FeetScoreDetail.walk_1_score == null ||
        parseFloat(this.walk25FeetScoreDetail.walk_1_score) === 0) {
        this.walk25FeetScoreDetail.scoreValue = parseFloat((this.walk25FeetScoreDetail.walk_2_score === '' ||
          this.walk25FeetScoreDetail.walk_2_score == null) ? 0 : this.walk25FeetScoreDetail.walk_2_score);
      } else if (this.walk25FeetScoreDetail.walk_2_score === '' ||
        this.walk25FeetScoreDetail.walk_2_score == null ||
        parseFloat(this.walk25FeetScoreDetail.walk_2_score) === 0) {
        this.walk25FeetScoreDetail.scoreValue = parseFloat((this.walk25FeetScoreDetail.walk_1_score === '' ||
          this.walk25FeetScoreDetail.walk_1_score == null) ? 0 : this.walk25FeetScoreDetail.walk_1_score);
      } else {
        this.walk25FeetScoreDetail.scoreValue = ((parseFloat(this.walk25FeetScoreDetail.walk_1_score =
          (this.walk25FeetScoreDetail.walk_1_score === '' || this.walk25FeetScoreDetail.walk_1_score == null)
            ? 0 : this.walk25FeetScoreDetail.walk_1_score || 0) + parseFloat(this.walk25FeetScoreDetail.walk_2_score
              = (this.walk25FeetScoreDetail.walk_2_score === '' || this.walk25FeetScoreDetail.walk_2_score == null) ?
                0 : this.walk25FeetScoreDetail.walk_2_score || 0)) / 2);
      }
      this.showUpdate = true;
    } else {
      if (this.score_1 === '' || this.score_1 == null || parseFloat(this.score_1) === 0) {
        this.scoreValue = parseFloat(this.score_2 === '' ? 0 : (this.score_2 == null) ? 0 : this.score_2);
      } else if (this.score_2 === '' || this.score_2 == null || parseFloat(this.score_2) === 0) {
        this.scoreValue = parseFloat(this.score_1 === '' ? 0 : (this.score_1 == null) ? 0 : this.score_1);
      } else {
        this.scoreValue = ((parseFloat((this.score_1 = this.score_1 || 0).toString()) +
          parseFloat((this.score_2 = this.score_2 || 0).toString())) / 2);
      }
    }
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  walk25FeetInfo() {
    const dialogConfig = { hasBackdrop: false, skipHide: true, panelClass: 'ns-25walk-theme', width: '300px', height: '340px' };
    this.dialog.openDialogs.pop();
    this.reportDialogRef = this.dialog.open(this.walk25FeetThirdLevelTemplate, dialogConfig);
    this.reportDialogRef.updatePosition({ top: '150px', left: '500px' });
  }

  getPayload(score1, score2) {
    const queryStringParams = this.neuroGraphService.get('queryParams');
    const payload: any = {
      walk_1_score: score1.toString(),
      walk_2_score: score2.toString(),
      pom_id: queryStringParams.pom_id,
      provider_id: queryStringParams.provider_id,
      save_csn: queryStringParams.csn,
      save_csn_status: queryStringParams.csn_status,
    };
    return payload;
  }

  saveWalk25FeetScore(opMode) {
    if (opMode === 'Update') {
      this.walk25FeetScoreDetail.walk_1_score = this.walk25FeetScoreDetail.walk_1_score || 0;
      this.walk25FeetScoreDetail.walk_2_score = this.walk25FeetScoreDetail.walk_2_score || 0;
      if (this.walk25FeetScoreDetail.walk_1_score >= 0
        && this.walk25FeetScoreDetail.walk_1_score <= 300
        && this.walk25FeetScoreDetail.walk_2_score >= 0
        && this.walk25FeetScoreDetail.walk_2_score <= 300
        && (Number(this.walk25FeetScoreDetail.walk_1_score)
          || Number(this.walk25FeetScoreDetail.walk_2_score))
        && !(this.walk25FeetScoreDetail.walk_1_score === 0
          && this.walk25FeetScoreDetail.walk_2_score === 0)) {
        const payload = this.getPayload(this.walk25FeetScoreDetail.walk_1_score, this.walk25FeetScoreDetail.walk_2_score);

        payload.score_id = this.walk25FeetScoreDetail.score_id;
        payload.updated_instant = this.walk25FeetScoreDetail.last_updated_instant;

        this.brokerService.httpPut(allHttpMessages.httpPutWalk25Feet, payload);
        this.scoreNotValidate = false;
      } else {
        this.scoreNotValidate = true;
      }
    } else {
      this.score_1 = this.score_1 || 0;
      this.score_2 = this.score_2 || 0;
      if ((Number(this.score_1) || Number(this.score_2)) && !(this.score_1 === 0 && this.score_2 === 0) && this.score_1 >= 0
        && this.score_1 <= 300
        && this.score_2 >= 0
        && this.score_2 <= 300) {
        let objSelForDate;

        objSelForDate = this.walk25FeetData.filter((obj => this.neuroGraphService.moment(obj.last_updated_instant)
          .format('MM/DD/YYYY') === this.neuroGraphService.moment(new Date()).format('MM/DD/YYYY')));
        if (objSelForDate.length > 0) {
          this.scoreNotSamedate = true;
        } else {
          this.scoreNotSamedate = false;
          const payload = this.getPayload(this.score_1, this.score_2);
          payload.updated_instant = this.neuroGraphService.moment(new Date()).format('MM/DD/YYYY HH:mm:ss');
          this.brokerService.httpPost(allHttpMessages.httpPostWalk25Feet, payload);
        }
        this.scoreNotValidate = false;
      } else {
        this.scoreNotValidate = true;
      }
    }
  }

  showSecondLevel(data) {
    this.showUpdate = false;
    this.scoreNotValidate = false;
    this.scoreNotSamedate = false;
    const config = { hasBackdrop: true, panelClass: 'ns-25walk-theme', width: '225px', skipHide: true, preserveScope: true };
    this.walk25FeetScoreDetail = { ...data, recordedDate: this.neuroGraphService.moment(data.last_updated_instant).format('MM/DD/YYYY') };

    if (!this.walk25FeetScoreDetail.save_csn_status || this.walk25FeetScoreDetail.save_csn_status.toUpperCase() !== 'CLOSED') {
      this.dialogRef = this.dialog.open(this.walk25FeetEditSecondLevelTemplate, config);
    } else {
      this.dialogRef = this.dialog.open(this.walk25FeetSecondLevelTemplate, config);
    }

    this.dialogRef.updatePosition({ top: `${d3.event.clientY - 150}px`, left: `${d3.event.clientX - 120}px` });
  }

  omit_special_char(event) {
    let k;
    k = event.charCode;
    return (k === 8 || k === 32 || k === 46 || (k >= 48 && k <= 57));
  }

  drawWalk25FeetAxis() {
    d3.selectAll('.walk25Feet-axis').remove();

    const clinicianDataSetforAxis = this.walk25FeetData.map(d => {
      return {
        ...d,
        scoreValue: Number(isNaN(d.walk_1_score) ? 0 : d.walk_1_score) === 0 ? Number(isNaN(d.walk_2_score) ?
          0 : d.walk_2_score) : (Number(isNaN(d.walk_2_score) ? 0 : d.walk_2_score) === 0 ?
            Number(isNaN(d.walk_1_score) ? 0 : d.walk_1_score) : ((Number(isNaN(d.walk_1_score) ?
              0 : d.walk_1_score) + Number(isNaN(d.walk_2_score) ? 0 : d.walk_2_score)) / 2))
      };
    }).sort((a, b) => a.lastUpdatedDate - b.lastUpdatedDate);
    let maxValue = Math.max.apply(Math, clinicianDataSetforAxis.map(function (o) { return o.scoreValue; })) + 10;
    if (maxValue < 30) {
      maxValue = 30;
    }
    this.yScale = d3
      .scaleLinear()
      .domain([0, maxValue])
      .range([GRAPH_SETTINGS.walk25Feet.chartHeight - 20, 0]);
    const svg = d3
      .select('#walk25feet')
      .append('g')
      .attr('class', 'walk25Feet-axis')
      .attr('transform', `translate(0,${GRAPH_SETTINGS.walk25Feet.positionTop})`);

    const oneDecimalFormat = d3.format('10');

    svg.append('g')
      .attr('class', 'walk25Feet-y-axis')
      .call(g => {
        const yAxis = g.call(d3.axisRight(this.yScale).ticks(4));
        g.select('.domain').remove();
        yAxis.selectAll('line')
          .style('display', 'none');
        yAxis.selectAll('text')
          .attr('x', '0')
          .attr('fill', GRAPH_SETTINGS.walk25Feet.color)
          .attr('transform', `translate(${GRAPH_SETTINGS.panel.offsetWidth - GRAPH_SETTINGS.panel.marginLeft + 5} , 0)`)
          .style('font-size', '1.2em')
          .style('font-weight', 'bold');
      });

    const axisText = svg.append('text')
      .attr('y', -25)
      .style('font-weight', 'bold')
      .style('font-size', '10px');
    axisText.append('tspan')
      .attr('x', GRAPH_SETTINGS.panel.offsetWidth - GRAPH_SETTINGS.panel.marginLeft - 20)
      .attr('dy', 0)
      .text(`25' Walk`);
    axisText.append('tspan')
      .attr('x', GRAPH_SETTINGS.panel.offsetWidth - GRAPH_SETTINGS.panel.marginLeft)
      .attr('dy', 10)
      .text('Secs');
  }

  drawWalk25FeetLineCharts() {
    const getParsedDate = (dtString) => {
      const dtPart = dtString.split(' ')[0];
      return Date.parse(dtPart);
    };

    const clinicianDataSet = this.walk25FeetData.map(d => {
      return {
        ...d,
        lastUpdatedDate: getParsedDate(d.last_updated_instant),
        scoreValue: Number(isNaN(d.walk_1_score) ? 0 : d.walk_1_score) === 0 ? Number(isNaN(d.walk_2_score) ?
          0 : d.walk_2_score) : (Number(isNaN(d.walk_2_score) ? 0 : d.walk_2_score) === 0 ?
            Number(isNaN(d.walk_1_score) ? 0 : d.walk_1_score) : ((Number(isNaN(d.walk_1_score) ?
              0 : d.walk_1_score) + Number(isNaN(d.walk_2_score) ? 0 : d.walk_2_score)) / 2))
      };
    }).sort((a, b) => a.lastUpdatedDate - b.lastUpdatedDate);

    const oneDecimalFormat = d3.format('10');

    const line = d3.line<any>()
      .x((d: any) => this.chartState.xScale(d.lastUpdatedDate))
      .y((d: any) => this.yScale(d.scoreValue));
    d3.select('#walk25feet')
      .append('clipPath')
      .attr('id', 'walk25feet-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', -20)
      .attr('width', this.chartState.canvasDimension.width)
      .attr('height', GRAPH_SETTINGS.walk25Feet.chartHeight + 20);

    const svg = d3
      .select('#walk25feet')
      .append('g')
      .attr('class', 'walk25feet-charts')
      .attr('transform', `translate(${GRAPH_SETTINGS.panel.marginLeft},${GRAPH_SETTINGS.walk25Feet.positionTop})`)
      .attr('clip-path', 'url(#walk25feet-clip)');

    svg.append('path')
      .datum(clinicianDataSet)
      .attr('class', 'line')
      .style('fill', 'none')
      .style('stroke', GRAPH_SETTINGS.walk25Feet.color)
      .style('stroke-width', '1')
      .attr('d', line);

    svg.selectAll('.dot-walk25feet')
      .data(clinicianDataSet)
      .enter()
      .append('circle')
      .attr('class', 'dot-walk25feet')
      .attr('cx', d => this.chartState.xScale(d.lastUpdatedDate))
      .attr('cy', d => this.yScale(d.scoreValue))
      .attr('r', 7)
      .style('fill', GRAPH_SETTINGS.walk25Feet.color)
      .style('cursor', 'pointer')
      .on('mouseover', d => {
        this.showSecondLevel(d);
      });
    svg.selectAll('.label-walk25feet')
      .data(clinicianDataSet)
      .enter()
      .append('text')
      .attr('class', 'label-walk25feet')
      .style('font-size', '10px')
      .attr('x', d => this.chartState.xScale(d.lastUpdatedDate) - 7)
      .attr('y', d => this.yScale(d.scoreValue) + 17)
      .text(d => oneDecimalFormat(d.scoreValue));

  }

  removeChart() {
    d3.selectAll('.walk25feet-charts').remove();
  }

  unloadChart() {
    d3.select('#walk25feet').selectAll('*').remove();
  }

}
