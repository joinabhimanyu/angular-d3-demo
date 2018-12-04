import { Component, OnInit, Input, ViewEncapsulation, ViewChild, TemplateRef, OnDestroy } from '@angular/core';
import * as d3 from 'd3';
import { GRAPH_SETTINGS } from '../../neuro-graph.config';
import { BrokerService } from '../../broker/broker.service';
import { allMessages, allHttpMessages, imagingConfig } from '../../neuro-graph.config';
import { MdDialog, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';
import { NeuroGraphService } from '../../neuro-graph.service';

@Component({
  selector: 'app-imaging,[app-imaging]',
  templateUrl: './imaging.component.html',
  styleUrls: ['./imaging.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ImagingComponent implements OnInit, OnDestroy {
  @ViewChild('imagingSecondLevelTemplate') private imagingSecondLevelTemplate: TemplateRef<any>;
  @ViewChild('imagingThirdLevelTemplate') private imagingThirdLevelTemplate: TemplateRef<any>;
  @Input() private chartState: any;

  private chart: any;
  private width: number;
  private height: number;
  private colors: any;
  private xAxis: any;
  private yAxis: any;
  private yScale: any;
  private yDomain: Array<number> = [0, 1];
  private lineA: any;
  private pathUpdate: any;
  private subscriptions: any;
  private imagingDataDetails: Array<any> = [];
  private imagingData: Array<any>;
  private imagingChartLoaded: boolean = false;
  private datasetA: Array<any>;
  private datasetB: Array<any> = [];
  private datasetC: Array<any> = [];
  private dialogRef: any;
  private reportDialogRef: any;
  private imagingReportDetails: any;
  registerDrag: any;

  constructor(private brokerService: BrokerService, public dialog: MdDialog,
    public reportDialog: MdDialog, private neuroGraphService: NeuroGraphService) {
    this.registerDrag = e => neuroGraphService.registerDrag(e);
  }

  ngOnInit() {
    this.subscriptions = this
      .brokerService
      .filterOn(allHttpMessages.httpGetImaging)
      .subscribe(d => {
        d.error
          ? (() => {
            console.log(d.error);
            this.brokerService.emit(allMessages.checkboxEnable, 'imaging');
          })()
          : (() => {
            try {
              if (d.data && d.data.EPIC && d.data.EPIC.patient && d.data.EPIC.patient[0]) {
                this.imagingData = d.data.EPIC.patient[0].imagingOrders
                  .filter(item => imagingConfig.some(f => f['CPT code'] === item.procedureCPTCode))
                  .filter(item => ((item.status) ? item.status.toUpperCase() : '') !== 'CANCELED'
                    && (item.authorizingProvider ? item.authorizingProvider : '') !== '');
              }
              if (d.data && d.data.EPIC && d.data.EPIC.patient && d.data.EPIC.patient[0]
                && d.data.EPIC.patient[0].imagingOrders && d.data.EPIC.patient[0].imagingOrders.length > 0) {
                this.createChart();
              }
              this.imagingChartLoaded = true;
              this.brokerService.emit(allMessages.checkboxEnable, 'imaging');
              if (this.imagingData && this.imagingData.length > 0
                && this.imagingData.some(m => m.orderDate === '' || m.orderDate === 'No result')) {
                this.brokerService.emit(allMessages.showCustomError, 'D-001');
              }
            } catch (ex) {
              console.log(ex);
              this.brokerService.emit(allMessages.showLogicalError, 'imaging');
              this.brokerService.emit(allMessages.checkboxEnable, 'imaging');
            }
          })();
      });

    const imaging = this
      .brokerService
      .filterOn(allMessages.neuroRelated)
      .filter(t => (t.data.artifact === 'imaging'));

    const sub1 = imaging
      .filter(t => t.data.checked)
      .subscribe(d => {
        d.error
          ? (() => {
            console.log(d.error);
          })
          : (() => {
            this
              .brokerService
              .httpGet(allHttpMessages.httpGetImaging, [
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
                }
              ]);
          })();
      });

    const sub2 = imaging
      .filter(t => !t.data.checked)
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : (() => {
            this.removeChart();
            this.imagingChartLoaded = false;
          })();
      });

    const sub3 = this.brokerService.filterOn(allMessages.graphScaleUpdated).subscribe(d => {
      d.error ? console.log(d.error) : (() => {
        if (this.imagingChartLoaded) {
          if (d.data.fetchData) {
            this.removeChart();
            this.brokerService.emit(allMessages.neuroRelated, { artifact: 'imaging', checked: true });
          } else {
            this.removeChart();
            this.createChart();
          }

        }
      })();
    });

    this
      .subscriptions
      .add(sub1)
      .add(sub2)
      .add(sub3);
  }
  ngOnDestroy() {
    this
      .subscriptions
      .unsubscribe();
  }

  showSecondLevel(data) {
    this.imagingDataDetails = [];
    const tempImaging: Array<any> = data.orderDetails;
    const i = 0;
    tempImaging.forEach(element => {
      const findData: Array<any> = tempImaging.filter(item => item.procedureCPTCode === element.procedureCPTCode);
      if (findData.length === 1) {
        if (this.imagingDataDetails.filter(item => item.procedureCPTCode === element.procedureCPTCode).length === 0) {
          this.imagingDataDetails.push(element);
        }
      } else {
        const compData: Array<any> = findData.filter(item => ((item.status) ? item.status.toUpperCase() : '') === 'COMPLETED');
        if (compData.length > 1) {
          compData.forEach(elem => {
            if (this.imagingDataDetails.filter(item => item.procedureCPTCode === elem.procedureCPTCode).length === 0) {
              this.imagingDataDetails.push(elem);
            }
          });
        } else {
          if (this.imagingDataDetails.filter(item => item.procedureCPTCode === compData[0].procedureCPTCode).length === 0) {
            this.imagingDataDetails.push(compData[0]);
          }
        }
      }
    });
    const dialogConfig = { hasBackdrop: true, skipHide: true, panelClass: 'ns-images-theme', width: '375px' };
    this.dialogRef = this.dialog.open(this.imagingSecondLevelTemplate, dialogConfig);
    this.dialogRef.updatePosition({ top: `${d3.event.clientY - 180}px`, left: `${d3.event.clientX - 190}px` });
  }

  showResult(imagingObj) {
    this.dialog.openDialogs.pop();
    this.imagingReportDetails = imagingObj;
    const dialogConfig = { hasBackdrop: false, skipHide: true, panelClass: 'ns-images-theme', width: '490px', height: '600px' };
    this.reportDialogRef = this.dialog.open(this.imagingThirdLevelTemplate, dialogConfig);
    this.reportDialogRef.updatePosition({ top: '70px', left: '860px' });
  }
  showImage(url) {
    const win = window.open(url, 'Images',
      'width=550, height=500, top=100, left=750, resizable=1, menubar=no', true);
    win.focus();
  }
  removeChart() {
    d3.select('#imaging').selectAll('*').remove();
    this.datasetB = [];
    this.datasetC = [];
  }
  hasDuplicates(array) {
    return (new Set(array)).size !== array.length;
  }
  filterCompletedProcedureWise() {
    const INCREASE_DAYS_ORDER = 60;
    const incompleteOrders = [];
    const completedOrders = [];
    const orders = this.datasetA.map(item => {
      return {
        ...item,
        orderDate: item.orderDate ? item.orderDate : this.neuroGraphService.moment().format('MM/DD/YYYY')
      }
    });
    orders.sort((prev, cur) => this.neuroGraphService.moment(prev.orderDate, 'MM/DD/YYYY') -
      this.neuroGraphService.moment(cur.orderDate, 'MM/DD/YYYY'));
    orders.map(item => {
      if (!item.status || (item.status ? item.status.toUpperCase() : '') === 'COMPLETED' && !item.resultDate) {
        incompleteOrders.push(item);
      } else if ((item.status ? item.status.toUpperCase() : '') === 'COMPLETED' && item.resultDate) {
        completedOrders.push(item);
      }
    });
    incompleteOrders.forEach(elem => {
      const procedureCPTCode = elem.procedureCPTCode;
      const lowerMargin = this.neuroGraphService.moment(elem.orderDate, 'MM/DD/YYYY');
      const upperMargin = this.neuroGraphService.moment(elem.orderDate, 'MM/DD/YYYY');
      upperMargin.add(INCREASE_DAYS_ORDER, 'days');
      if (!completedOrders.find(inner => inner.procedureCPTCode === procedureCPTCode &&
        this.neuroGraphService.moment(inner.orderDate, 'MM/DD/YYYY') >= lowerMargin
        && this.neuroGraphService.moment(inner.orderDate, 'MM/DD/YYYY') <= upperMargin)) {
        completedOrders.push(elem);
      }
    });
    this.datasetC = completedOrders;
  }
  formulateStatusSuccinct(): void {
    if (this.datasetC && this.datasetC.length > 0) {
      const uniqueOderFormateDates = this.datasetC.map(x => x.orderDate).filter((item, index, obj) => obj.indexOf(item) === index);
      if (uniqueOderFormateDates && uniqueOderFormateDates.length > 0) {
        uniqueOderFormateDates.forEach(corderDate => {
          const filter = this.datasetC
            .filter(x => this.neuroGraphService.moment(x.orderDate, 'MM/DD/YYYY').format('MM/DD/YYYY')
              === this.neuroGraphService.moment(corderDate, 'MM/DD/YYYY').format('MM/DD/YYYY'));
          let orderDate = null;
          let status = null;
          let orderDetails = [];
          orderDate = filter[0].orderDate;
          orderDetails = [...filter];
          const full = filter.filter(x => (x.status || '').toUpperCase() === 'COMPLETED' && x.resultDate);
          if (full && full.length > 0) {
            status = 'Full';
            const empty = [...filter.filter(x => (x.status || '').toUpperCase() === ''),
            ...filter.filter(x => (x.status || '').toUpperCase() === 'COMPLETED' && !x.resultDate)];
            if (empty && empty.length > 0) {
              status = 'Half';
            }
          } else {
            status = 'Empty';
          }
          this.datasetB.push({
            orderDate,
            status,
            orderDetails
          });
        });
        this.datasetC = [];
      }
    }
  }
  sortByOrderDate(): void {
    this.datasetB = this.datasetB.map(d => {
      return {
        ...d,
        orderDate: d.orderDate,
        status: d.status
      };
    }).sort((a, b) => a.orderDate - b.orderDate);
  }
  noFilterCompleted() {
    this.datasetC = [...this.datasetA.map((item) => item)];
  }

  createChart() {
    d3.select('#imaging').selectAll('*').remove();
    this.datasetA = this.imagingData.map(d => {
      return {
        ...d,
        orderDate: d.orderDate,
        status: d.status,
      };
    });
    this.filterCompletedProcedureWise();
    this.formulateStatusSuccinct();
    this.sortByOrderDate();

    const element = d3.select('#imaging');
    this.width = GRAPH_SETTINGS.panel.offsetWidth - GRAPH_SETTINGS.panel.marginLeft - GRAPH_SETTINGS.panel.marginRight;
    this.height = GRAPH_SETTINGS.panel.offsetHeight - GRAPH_SETTINGS.panel.marginTop - GRAPH_SETTINGS.panel.marginBottom;

    this.yScale = d3
      .scaleLinear()
      .domain(this.yDomain)
      .range([GRAPH_SETTINGS.imaging.chartHeight - 20, 0]);

    this.lineA = d3.line<any>()
      .x((d: any) => this.chartState.xScale(d.orderDate))
      .y(0);

    d3.select('#imaging')
      .append('clipPath')
      .attr('id', 'imaging-clip')
      .append('rect')
      .attr('x', 0)
      .attr('y', -GRAPH_SETTINGS.imaging.chartHeight / 2)
      .attr('width', this.chartState.canvasDimension.width)
      .attr('height', GRAPH_SETTINGS.imaging.chartHeight);

    this.chart = d3.select('#imaging')
      .append('g')
      .attr('transform', 'translate(' + GRAPH_SETTINGS.panel.marginLeft + ',' + GRAPH_SETTINGS.imaging.positionTop + ')')
      .attr('clip-path', 'url(#imaging-clip)');

    this.pathUpdate = this.chart.append('path')
      .datum([
        { 'orderDate': this.chartState.xDomain.currentMinValue },
        { 'orderDate': this.chartState.xDomain.currentMaxValue }
      ])
      .attr('d', this.lineA)
      .attr('stroke', GRAPH_SETTINGS.imaging.color)
      .attr('stroke-width', '10')
      .attr('opacity', '0.25')
      .attr('fill', 'none')
      .attr('class', 'lineA');

    const gradImg = this.chart
      .append('defs')
      .append('linearGradient')
      .attr('id', 'gradImg')
      .attr('x1', '0%')
      .attr('x2', '0%')
      .attr('y1', '100%')
      .attr('y2', '0%');

    gradImg.append('stop').attr('offset', '50%').style('stop-color', GRAPH_SETTINGS.imaging.color);
    gradImg.append('stop').attr('offset', '50%').style('stop-color', 'white');

    this.chart.selectAll('.dot')
      .data(this.datasetB)
      .enter()
      .append('circle')
      .attr('class', 'dot')
      .attr('cx', d => this.chartState.xScale(this.neuroGraphService.moment(d.orderDate, 'MM/DD/YYYY')))
      .attr('cy', 0)
      .attr('r', 10)
      .style('cursor', 'pointer')
      .style('stroke', GRAPH_SETTINGS.imaging.color)
      .style('fill', d => {
        let returnColor;
        if (d.status === 'Empty') {
          returnColor = '#FFF';
        } else if (d.status === 'Full') {
          returnColor = GRAPH_SETTINGS.imaging.color;
        } else {
          returnColor = 'url(#gradImg)';
        }
        return returnColor;
      })
      .on('click', d => {
        this.showSecondLevel(d);
      });

    this.chart.append('text')
      .attr('transform', 'translate(' + this.chartState.xScale(this.chartState.xDomain.currentMinValue) + ',' + '3.0' + ')')
      .attr('dy', 15)
      .attr('text-anchor', 'start')
      .attr('font-size', '10px')
      .text('Imaging');
  }

  formulateStatus(): void {
    let repeatCount = 0;
    let isComplete = '';
    const i = 0;
    while (i < this.datasetC.length) {
      let arrData: Array<number> = [];
      for (let j = 0; j < this.datasetC.length; j++) {
        if (this.datasetC[i].orderFormatDate === this.datasetC[j].orderFormatDate) {
          if (repeatCount === 0) {
            if ((this.datasetC[j].status ? this.datasetC[j].status.toUpperCase() : '') === 'COMPLETED') {
              isComplete = 'Full';
            } else {
              isComplete = 'Empty';
            }
            this.datasetB.push({
              'orderDate': this.datasetC[j].orderDate,
              'status': isComplete,
              'orderDetails': [this.datasetC[j]]
            });
            arrData.push(j);
            repeatCount++;
          } else {
            if ((this.datasetC[j].status ? this.datasetC[j].status.toUpperCase() : '') !== 'COMPLETED' && isComplete === 'Full') {
              const filtrdata = this.datasetB[this.datasetB.length - 1].orderDetails
                .filter(item => item.procedureCPTCode !== this.datasetC[j].procedureCPTCode
                  && item.orderDate === this.datasetC[j].orderDate);
              if (filtrdata.length > 0) {
                isComplete = 'Half';
              }
              this.datasetB[this.datasetB.length - 1].status = isComplete;
            } else if ((this.datasetC[j].status ? this.datasetC[j].status.toUpperCase() : '') === 'COMPLETED' && isComplete === 'Empty') {
              const filtrdata = this.datasetB[this.datasetB.length - 1].orderDetails
                .filter(item => item.procedureCPTCode !== this.datasetC[j].procedureCPTCode
                  && item.orderDate === this.datasetC[j].orderDate);
              if (filtrdata.length > 0) {
                isComplete = 'Half';
              } else {
                isComplete = 'Full';
              }
              this.datasetB[this.datasetB.length - 1].status = isComplete;
            }
            this.datasetB[this.datasetB.length - 1].orderDetails.push(this.datasetC[j]);
            arrData.push(j);
          }
        }
      }
      arrData.reverse();
      arrData.forEach(element => {
        this.datasetC.splice(element, 1);
      });
      arrData = [];
      repeatCount = 0;
      isComplete = 'Empty';
    }
  }

  //#region deprecated
  // const treatedList: any[] = this.prepareNullList(0, nullFilter, nullFilter.length);
  // (treatedList && treatedList.length > 0) && treatedList.forEach((item) => {
  //   const lowerMargin = new Date(item.orderDate);
  //   const upperMargin = new Date(item.orderDate);
  //   upperMargin.setDate(lowerMargin.getDate() + INCREASE_DAYS_ORDER);
  //   const inclusiveCompSet = compFilter.filter(inner =>
  //     this.neuroGraphService.moment(inner.orderDate, 'MM/DD/YYYY')
  //     >= this.neuroGraphService.moment(lowerMargin, 'MM/DD/YYYY') &&
  //     this.neuroGraphService.moment(inner.orderDate, 'MM/DD/YYYY')
  //     <= this.neuroGraphService.moment(upperMargin, 'MM/DD/YYYY'));
  //   if (inclusiveCompSet && inclusiveCompSet.length > 0) {
  //     inclusiveCompSet.forEach((inner) => {
  //       (this.datasetC.filter((f) => f.orderID === inner.orderID).length === 0) && 
  // this.datasetC.push(Object.assign({}, inner));
  //     });
  //   }
  //   const exclusiveCompSet = compFilter.filter((inner) =>
  //     this.neuroGraphService.moment(inner.orderDate, 'MM/DD/YYYY')
  //     >= this.neuroGraphService.moment(lowerMargin, 'MM/DD/YYYY')
  //     && this.neuroGraphService.moment(inner.orderDate, 'MM/DD/YYYY')
  //     > this.neuroGraphService.moment(upperMargin, 'MM/DD/YYYY'));
  //   (exclusiveCompSet && exclusiveCompSet.length > 0) && exclusiveCompSet.forEach((inner) => {
  //     (this.datasetC.filter((f) => f.orderID === inner.orderID).length === 0) && 
  // this.datasetC.push(Object.assign({}, inner));
  //   });
  //   if (exclusiveCompSet && exclusiveCompSet.length > 0) {
  //     (this.datasetC.filter((f) => f.orderID === item.orderID).length === 0) && this.datasetC.push(Object.assign({}, item));
  //   }
  // });
  //#endregion
}

