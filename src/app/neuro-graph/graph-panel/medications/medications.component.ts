import {
  Component,
  OnInit,
  Input,
  TemplateRef,
  ViewChild,
  ViewEncapsulation,
  OnDestroy,
  Output, EventEmitter
} from '@angular/core';
import { MdDialog, MdDialogRef } from '@angular/material';
import * as d3 from 'd3';
import { BrokerService } from '../../broker/broker.service';
import { allMessages, allHttpMessages, medication, GRAPH_SETTINGS } from '../../neuro-graph.config';
import { searchObject } from '../../neuro-graph.helper';
import { NeuroGraphService } from '../../neuro-graph.service';

@Component({
  selector: 'app-medications,[app-medications]',
  templateUrl: './medications.component.html',
  styleUrls: ['./medications.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class MedicationsComponent implements OnInit, OnDestroy {
  @ViewChild('dmtSecondLevelTemplate') private dmtSecondLevelTemplate: TemplateRef<any>;
  @ViewChild('vitaminDSecondLevelTemplate') private vitaminDSecondLevelTemplate: TemplateRef<any>;
  @ViewChild('otherMedsSecondLevelTemplate') private otherMedsSecondLevelTemplate: TemplateRef<any>;
  @ViewChild('secondLevelOptions') private secondLevelOptions: TemplateRef<any>;
  @Input() private chartState: any;
  @Output() enlargeMedicationParent = new EventEmitter();

  eventClientX: number;
  eventClientY: number;
  optionsData: any = null;
  graphDimension = GRAPH_SETTINGS.panel;
  chartsWidth = GRAPH_SETTINGS.medications.chartsWidth;
  dialogRef: MdDialogRef<any>;
  medSecondLayerModel: any;
  subscriptions: any;
  allMedicationData: Array<any> = [];
  dmtArray: Array<any> = [];
  vitaminDArray: Array<any> = [];
  otherMedsArray: Array<any> = [];
  registerDrag: any;
  queryParams: any;
  selectedMed = {
    dmt: false,
    otherMeds: false,
    vitaminD: false
  };
  medType = {
    dmt: 'dmt',
    otherMeds: 'otherMeds',
    vitaminD: 'vitaminD'
  };
  dmtSecondLayerLocalData: Array<any>;
  otherMedsSecondLayerLocalData: Array<any>;
  relapsesLocalData: Array<any>;
  noOfRelapses: any = '';
  months = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'
  ];
  enlarge = false;

  constructor(private brokerService: BrokerService, private dialog: MdDialog, private neuroGraphService: NeuroGraphService) {
    this.registerDrag = e => neuroGraphService.registerDrag(e);
    this.queryParams = this.neuroGraphService.get('queryParams');
  }

  ngOnInit() {
    this.subscriptions = this.brokerService.filterOn(allHttpMessages.httpGetMedications).subscribe(d => {
      d.error
        ? (() => {
          console.log(d.error);
          this.brokerService.emit(allMessages.checkboxEnable, 'dmt');
        })()
        : (() => {
          try {
            this.prepareMedications(d.data);
            this.drawAllPortions();
            this.brokerService.emit(allMessages.checkboxEnable, 'dmt');
          } catch (e) {
            console.log(e);
            this.brokerService.emit(allMessages.checkboxEnable, 'dmt');
            this.brokerService.emit(allMessages.showLogicalError, 'treatments');
          }
        })();
    });

    const neuroRelated = this.brokerService.filterOn(allMessages.neuroRelated);
    this.processMedication(neuroRelated, this.medType.dmt);
    this.processMedication(neuroRelated, this.medType.vitaminD);
    this.processMedication(neuroRelated, this.medType.otherMeds);


    const subRelapses = this.brokerService.filterOn('DMT_SECOND_LAYER_RELAPSES').subscribe(d => {
      d.error
        ? (() => {
          this.noOfRelapses = 'n/a';
          console.log(d.error);
        })()
        : (() => {
          const response = d.data[0][allHttpMessages.httpGetRelapse];
          this.relapsesLocalData = response.relapses || [];
          const selectedData = d.carryBag;
          const medOrderedDt = (new Date(selectedData.date.orderDate));
          medOrderedDt.setDate(1);
          const medEndDt = (new Date(selectedData.date.medEnd));
          medEndDt.setDate(1);
          if (this.relapsesLocalData) {
            this.noOfRelapses = this.relapsesLocalData.filter(r => {
              const relapseMonthNo = this.months.indexOf(r.relapse_month);
              const relapseYear = parseInt(r.relapse_year, 10);
              const relapseDate = new Date(relapseYear, relapseMonthNo, 1);
              return (relapseDate >= medOrderedDt) && (relapseDate <= medEndDt);
            }).length;
          }
        })();
    });

    const subDmtSecondLayer = this.brokerService.filterOn(allHttpMessages.httpGetDmt).subscribe(d => {
      d.error
        ? (() => {
          console.log(d.error);
        })()
        : (() => {
          try {
            this.dmtSecondLayerLocalData = d.data.DMTs || [];
            const selectedData = d.carryBag;
            let dmt;
            this.dmtSecondLayerLocalData && (dmt = this.dmtSecondLayerLocalData.find(x => {
              return selectedData.orderIdentifier && x.dmt_order_id
                && x.dmt_order_id.toString() === selectedData.orderIdentifier.toString();
            }));
            this.medSecondLayerModel = this.getSecondLayerModel(selectedData, this.medType.dmt, dmt);
            this.dialog.openDialogs.pop();
            const config = { hasBackdrop: true, panelClass: 'ns-dmt-theme', width: '400px' };
            this.dialogRef = this.dialog.open(this.dmtSecondLevelTemplate, config);
            this.dialogRef.updatePosition(selectedData.dialogPosition);
          } catch (e) {
            console.log(e);
            this.brokerService.emit(allMessages.showLogicalError, 'treatments');
          }
        })();
    });

    const subOtherMedsSecondLayer = this.brokerService.filterOn(allHttpMessages.httpGetOtherMeds).subscribe(d => {
      d.error
        ? (() => {
          console.log(d.error);
        })()
        : (() => {
          try {
            const otherMedsResponse = d.data;
            this.otherMedsSecondLayerLocalData = otherMedsResponse.Other_Meds || [];
            const selectedData = d.carryBag;
            let otherMeds;
            this.otherMedsSecondLayerLocalData && (otherMeds = this.otherMedsSecondLayerLocalData.find(x => {
              return selectedData.orderIdentifier && x.other_med_order_id
                && x.other_med_order_id.toString() === selectedData.orderIdentifier.toString();
            }));
            this.medSecondLayerModel = this.getSecondLayerModel(selectedData, this.medType.otherMeds, otherMeds);
            this.dialog.openDialogs.pop();
            const config = { hasBackdrop: true, panelClass: 'ns-othermeds-theme', width: '400px' };
            this.dialogRef = this.dialog.open(this.otherMedsSecondLevelTemplate, config);
            this.dialogRef.updatePosition(selectedData.dialogPosition);
          } catch (e) {
            console.log(e);
            this.brokerService.emit(allMessages.showLogicalError, 'treatments');
          }
        })();
    });

    const subScaleUpdate = this.brokerService.filterOn(allMessages.graphScaleUpdated).subscribe(d => {
      d.error ? console.log(d.error) : (() => {
        if (this.selectedMed.dmt) {
          this.removeDmt();
          if (d.data.fetchData) {
            this.brokerService.emit(allMessages.neuroRelated, { artifact: this.medType.dmt, checked: true });
          } else {
            this.drawDmt();
          }
        }
        if (this.selectedMed.otherMeds) {
          this.removeOtherMeds();
          if (d.data.fetchData) {
            this.brokerService.emit(allMessages.neuroRelated, { artifact: this.medType.otherMeds, checked: true });
          } else {
            this.drawOtherMeds();
          }
        }
        if (this.selectedMed.vitaminD) {
          this.removeVitaminD();
          if (d.data.fetchData) {
            this.brokerService.emit(allMessages.neuroRelated, { artifact: this.medType.vitaminD, checked: true });
          } else {
            this.drawVitaminD();
          }
        }
      })();
    });

    const subDmtPost = this.brokerService.filterOn(allHttpMessages.httpPostDmt).subscribe(d => {
      d.error ? console.log(d.error) : (() => {
        this.dialogRef.close();
      })();
    });

    const subDmtPut = this.brokerService.filterOn(allHttpMessages.httpPutDmt).subscribe(d => {
      d.error ? console.log(d.error) : (() => {
        this.dialogRef.close();
      })();
    });

    const subOtherMedsPost = this.brokerService.filterOn(allHttpMessages.httpPostOtherMeds).subscribe(d => {
      d.error ? console.log(d.error) : (() => {
        this.dialogRef.close();
      })();
    });

    const subOtherMedsPut = this.brokerService.filterOn(allHttpMessages.httpPutOtherMeds).subscribe(d => {
      d.error ? console.log(d.error) : (() => {
        this.dialogRef.close();
      })();
    });

    this.subscriptions
      .add(subRelapses)
      .add(subScaleUpdate)
      .add(subDmtPost)
      .add(subDmtPut)
      .add(subOtherMedsPost)
      .add(subOtherMedsPut)
      .add(subDmtSecondLayer)
      .add(subOtherMedsSecondLayer);
  }

  ngOnDestroy() {
    this.subscriptions.unsubscribe();
  }

  processMedication(neuroRelated, medication) {
    const sub1 = neuroRelated.filter(t => t.data.artifact === medication && t.data.checked).subscribe(d => {
      d.error
        ? (() => {
          console.log(d.error);
        })
        : (() => {
          this.selectedMed[medication] = true;
          this.brokerService.httpGet(allHttpMessages.httpGetMedications, [
            {
              name: 'pom-id',
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

    const sub2 = neuroRelated.filter(t => {
      return ((t.data.artifact === medication) && (!t.data.checked));
    }).subscribe(d => {
      d.error
        ? console.log(d.error)
        : (() => {
          this.selectedMed[medication] = false;
          if (medication === this.medType.dmt) {
            this.removeDmt();
          } else if (medication === this.medType.vitaminD) {
            this.removeVitaminD();
          } else {
            this.removeOtherMeds();
          }
        })();
    });
    this
      .subscriptions
      .add(sub1)
      .add(sub2);
  }

  prepareMedications(data) {
    let medicationOrders: Array<any> = [];
    data && data.EPIC && data.EPIC.patients && (data.EPIC.patients.length > 0)
      && (medicationOrders = data.EPIC.patients[0].medicationOrders);
    medicationOrders = medicationOrders.filter(x => (x.pendedOrder || '').toLowerCase() !== 'yes');
    const genericNames = medication.dmt.genericNames.toString().toLowerCase().split(',');
    const infusionNames = medication.infusion.genericNames.sort((a, b) => a.duration - b.duration)
      .map((item) => ({ name: item.name.toLowerCase(), duration: item.duration }));
    const vitaminDIds = medication.vitaminD.ids;
    const otherMedsIds = medication.otherMeds.ids;
    const otherMedsNames = medication.otherMeds.names;
    const mappedCodes = medication.otherMeds.mappedCodes;
    const exclusionList = medication.exclusionList.names;

    const hasMatchedMappedCodes = (med) => {
      const matched = [];
      med.associatedDiagnoses.forEach(ad => {
        ad.codeSets.forEach(cs => {
          cs.mappedCode.forEach(mc => {
            if (mappedCodes.find(c => c === mc)) {
              matched.push(mc);
            }
          });
        });
      });
      return (matched.length > 0);
    };

    medicationOrders = medicationOrders.filter(m => !m.orderStatus || m.orderStatus.toLowerCase() !== 'canceled');

    medicationOrders.forEach(x => {
      if (x.medication && genericNames.find(gn => {
        return x.medication.simpleGenericName && x.medication.simpleGenericName[0]
          && gn === x.medication.simpleGenericName[0].toLowerCase();
      })) {
        x.type || (x.type = this.medType.dmt);
      } else if (x.medication && vitaminDIds.find(id => id.toString() === x.medication.id.toString())) {
        x.type || (x.type = this.medType.vitaminD);
      } else if (x.medication && otherMedsIds.find(id => id.toString() === x.medication.id.toString())) {
        x.type || (x.type = this.medType.otherMeds);
      } else if (x.medication && otherMedsNames.filter(name => x.medication.name.toLowerCase().startsWith(name.toLowerCase())).length > 0) {
        x.type || (x.type = this.medType.otherMeds);
      } else if (hasMatchedMappedCodes(x)) {
        x.type || (x.type = this.medType.otherMeds);
      }
    });

    const filter = medicationOrders.filter(x => infusionNames.find(gn => x.medication.name && gn.name === x.medication.name.toLowerCase()));
    if (filter && filter.length > 0) {
      filter.forEach((item) => {
        const mdFilter = infusionNames.filter(x => x.name === item.medication.name.toLowerCase());
        if (mdFilter && mdFilter.length > 0) {
          const medEnd = this.addRealMonth(this.neuroGraphService.moment(item.date.medStart, 'MM/DD/YYYY'), +mdFilter[0].duration);
          (medEnd) && (item.date.medEnd = this.neuroGraphService.moment(medEnd).format('MM/DD/YYYY'));
        }
      });
    }

    const filteredMedicationOrders = medicationOrders.filter(x => x.medication &&
      exclusionList.filter(name => x.medication.name.toLowerCase().startsWith(name.toLowerCase())).length === 0);

    this.dmtArray = filteredMedicationOrders
      .filter(x => x.type === this.medType.dmt)
      .sort((a, b) => Date.parse(b.date.orderDate) - Date.parse(a.date.orderDate));
    this.vitaminDArray = filteredMedicationOrders
      .filter(x => x.type === this.medType.vitaminD)
      .sort((a, b) => Date.parse(b.date.orderDate) - Date.parse(a.date.orderDate));
    this.otherMedsArray = filteredMedicationOrders
      .filter(x => x.type === this.medType.otherMeds)
      .sort((a, b) => Date.parse(b.date.orderDate) - Date.parse(a.date.orderDate));
  }
  private addRealMonth(d: any, months: number) {
    const fm = this.neuroGraphService.moment(d).add(months, 'M');
    const fmEnd = this.neuroGraphService.moment(fm).endOf('month');
    return d.date() !== fm.date() && fm.isSame(fmEnd.format('MM/DD/YYYY')) ? fm.add(1, 'd') : fm;
  }
  checkForError(meds: Array<any>) {
    if (!meds.every(m => m.date.length !== 0)) {
      this.brokerService.emit(allMessages.showCustomError, 'D-001');
    }
  }

  getSecondLayerModel(firstLayerData, medType, secondLayerData) {
    const model: any = {
      medicationId: firstLayerData.medication.id,
      orderIdentifier: firstLayerData.orderIdentifier ? firstLayerData.orderIdentifier.toString() : '',
      contactSerialNumber: firstLayerData.contactSerialNumber ? firstLayerData.contactSerialNumber.toString() : '',
      name: firstLayerData.medication.name,
      simpleGenericName: firstLayerData.medication.simpleGenericName
        && firstLayerData.medication.simpleGenericName.length > 0 ? firstLayerData.medication.simpleGenericName[0] : '',
      orderDate: firstLayerData.date.orderDate,
      medEnd: firstLayerData.date.medEnd,
      medQuantity: firstLayerData.medQuantity,
      frequency: firstLayerData.frequency,
      refillCount: firstLayerData.refillCount,
      refillRemain: firstLayerData.refillRemain,
      allYears: Array.from(new Array(100), (val, index) => (new Date()).getFullYear() - index)
    };
    if (secondLayerData) {
      model.save_csn_status = secondLayerData.save_csn_status;
      model.allowEdit = !secondLayerData.save_csn_status || secondLayerData.save_csn_status.toUpperCase() !== 'CLOSED';

      if (medType === this.medType.dmt) {
        model.reasonStopped = secondLayerData.reason_stopped;
        model.otherReason = secondLayerData.reason_stopped_text;
        const dtParts = secondLayerData.patient_reported_start.split('/');
        if (dtParts.length === 2) {
          model.patientReportedStartDateMonth = parseInt(dtParts[0], 10);
          model.patientReportedStartDateYear = parseInt(dtParts[1], 10);
          model.patientReportedStartDateMonthName = this.months[model.patientReportedStartDateMonth - 1];
        }
      }
      if (medType === this.medType.otherMeds) {
        model.reasonForMed = secondLayerData.reason_for_med;
      }
      if (medType === this.medType.vitaminD) {
        model.medEnded = firstLayerData.date.medEnded;
      }
    } else {
      model.save_csn_status = this.queryParams.csn_status;
      model.allowEdit = true;
    }
    return model;
  }

  updateDmt() {
    const dmt = this.dmtSecondLayerLocalData.find(x => {
      return x.dmt_order_id === this.medSecondLayerModel.orderIdentifier;
    });
    const payload: any = {
      pom_id: this.queryParams.pom_id,
      dmt_order_id: this.medSecondLayerModel.orderIdentifier,
      patient_reported_start: `${this.medSecondLayerModel.patientReportedStartDateMonth}
      /${this.medSecondLayerModel.patientReportedStartDateYear}`,
      reason_stopped: this.medSecondLayerModel.reasonStopped,
      reason_stopped_text: this.medSecondLayerModel.otherReason,
      provider_id: this.queryParams.provider_id,
      updated_instant: this.neuroGraphService.moment(new Date()).format('MM/DD/YYYY HH:mm:ss'),
      save_csn: this.queryParams.csn,
      save_csn_status: this.queryParams.csn_status
    };
    if (dmt) {
      this.brokerService.httpPut(allHttpMessages.httpPutDmt, payload);
    } else {
      this.brokerService.httpPost(allHttpMessages.httpPostDmt, payload);
    }
  }

  updateOtherMeds() {
    const otherMed = this.otherMedsSecondLayerLocalData.find(x => {
      return x.other_med_order_id === this.medSecondLayerModel.orderIdentifier;
    });
    const payload: any = {
      pom_id: this.queryParams.pom_id,
      other_med_order_id: this.medSecondLayerModel.orderIdentifier,
      reason_for_med: this.medSecondLayerModel.reasonForMed,
      provider_id: this.queryParams.provider_id,
      updated_instant: this.neuroGraphService.moment(new Date()).format('MM/DD/YYYY HH:mm:ss'),
      save_csn: this.queryParams.csn,
      save_csn_status: this.queryParams.csn_status
    };
    if (otherMed) {
      this.brokerService.httpPut(allHttpMessages.httpPutOtherMeds, payload);
    } else {
      this.brokerService.httpPost(allHttpMessages.httpPostOtherMeds, payload);
    }
  }

  drawAllPortions() {
    if (this.selectedMed[this.medType.dmt]) {
      this.checkForError(this.dmtArray);
      this.drawDmt();
    }
    if (this.selectedMed[this.medType.vitaminD]) {
      this.checkForError(this.vitaminDArray);
      this.drawVitaminD();
    }
    if (this.selectedMed[this.medType.otherMeds]) {
      this.checkForError(this.otherMedsArray);
      this.drawOtherMeds();
    }
  }


  drawDmt() {
    const openSecondLayer = (selectedData) => {
      selectedData.dialogPosition = { top: `${d3.event.clientY - 300}px`, left: `${d3.event.clientX - 200}px` };
      this.noOfRelapses = '';
      this.brokerService.httpGetMany('DMT_SECOND_LAYER_RELAPSES', [
        {
          urlId: allHttpMessages.httpGetRelapse,
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
      ], selectedData);

      this.brokerService.httpGet(allHttpMessages.httpGetDmt, [
        {
          name: 'pom_id',
          value: this.neuroGraphService.get('queryParams').pom_id
        }
      ], null, selectedData);
    };

    this.drawChart(this.dmtArray, this.medType.dmt,
      GRAPH_SETTINGS.medications.dmtColor, GRAPH_SETTINGS.medications.dmtOverlapColor, openSecondLayer);
  }

  drawVitaminD() {
    const config = { hasBackdrop: true, panelClass: 'ns-vitaminD-theme', width: '300px' };
    const openSecondLayer = (selectedData) => {
      this.medSecondLayerModel = this.getSecondLayerModel(selectedData, this.medType.vitaminD, false);
      this.dialogRef = this.dialog.open(this.vitaminDSecondLevelTemplate, config);
      this.dialogRef.updatePosition({ top: `${d3.event.clientY - 200}px`, left: `${d3.event.clientX - 150}px` });
    };
    this.drawChart(this.vitaminDArray, this.medType.vitaminD,
      GRAPH_SETTINGS.medications.vitaminDColor, GRAPH_SETTINGS.medications.vitaminDOverlapColor, openSecondLayer);
  }

  drawOtherMeds() {
    const openSecondLayer = (selectedData) => {
      selectedData.dialogPosition = { top: `${d3.event.clientY - 250}px`, left: `${d3.event.clientX - 200}px` };
      this.brokerService.httpGet(allHttpMessages.httpGetOtherMeds, [
        {
          name: 'pom_id',
          value: this.neuroGraphService.get('queryParams').pom_id
        }
      ], null, selectedData);

    };
    this.drawChart(this.otherMedsArray, this.medType.otherMeds,
      GRAPH_SETTINGS.medications.otherMedsColor, GRAPH_SETTINGS.medications.otherMedsOverlapColor, openSecondLayer);
  }

  removeDmt() {
    this.removeChart(this.medType.dmt);
  }

  removeVitaminD() {
    this.removeChart(this.medType.vitaminD);
  }

  removeOtherMeds() {
    this.removeChart(this.medType.otherMeds);
  }

  getEndDate(input) {
    if (input) {
      return Date.parse(input);
    }
    return this.chartState.xDomain.scaleMaxValue;
  }

  getShortenedName(input) {
    if (!input) { return ''; }
    const parts = input.split(' ');
    const capitalize = parts[0].toLowerCase().replace(/\b(\w)/g, s => s.toUpperCase());
    return capitalize + ' ...';
  }
  calculateBarWidth(self: MedicationsComponent, barWidth: number, d: any) {
    const medStartDate = Date.parse(d.date.medStart || d.date.orderDate);
    const medEndDate = self.getEndDate(d.date.medEnd);
    const timelineMinDate = Date.parse(self.chartState.xDomain.currentMinValue);
    let iBarWidth = 0;
    if (medStartDate >= timelineMinDate) {
      iBarWidth = self.chartState.xScale(medEndDate) - self.chartState.xScale(medStartDate);
    } else {
      iBarWidth = self.chartState.xScale(medEndDate) - self.chartState.xScale(self.chartState.xDomain.currentMinValue);
    }
    barWidth = iBarWidth <= 0 ? barWidth : iBarWidth;
    return barWidth;
  }
  calculateIntersection(filter: any, node: any, barWidth: number, localOverlaps: any, mode: string, i: number) {
    const x = node ? +node.getAttribute('x') : 0;
    const y = node ? +node.getAttribute('y') : 0;
    const width = +barWidth;
    const oFilter = filter.filter(inode => this.filterMatchingInnerNodes(node, width, inode, mode, i));
    if (oFilter && oFilter.length > 0) {
      let oFilterMap = [];
      switch (mode) {
        case 'inner':
          oFilterMap = oFilter.map(inode => {
            const ix = inode ? +inode.getAttribute('x') : 0;
            return {
              item: `${ix};${y};${Math.abs(width - Math.abs(ix - x))}`,
              data: inode.__data__
            };
          });
          break;
        case 'containing':
          oFilterMap = oFilter.map(inode => {
            const ix = inode ? +inode.getAttribute('x') : 0;
            const iwidth = inode ? +inode.getAttribute('width') || 0 : 0;
            return {
              item: `${ix};${y};${iwidth || 0}`,
              data: inode.__data__
            };
          });
          break;
        case 'touching':
          oFilterMap = oFilter.map(inode => {
            const ix = inode ? +inode.getAttribute('x') : 0;
            const iwidth = 1;
            return {
              item: `${ix};${y};${iwidth}`,
              data: inode.__data__
            };
          });
          break;
      }
      localOverlaps = [...localOverlaps, ...oFilterMap];
    }
    return localOverlaps;
  }
  filterMatchingInnerNodes(node: any, width: number, inode: any, mode: string, i: number): boolean {
    const x = node ? +node.getAttribute('x') : 0;
    const brandname = node ? node.getAttribute('data-brandname') : '';
    const dose = node ? node.getAttribute('data-dose') : '';
    const frequency = node ? node.getAttribute('data-frequency') : '';
    const ibrandname = inode ? inode.getAttribute('data-brandname') : '';
    const idose = inode ? inode.getAttribute('data-dose') : '';
    const ifrequency = inode ? inode.getAttribute('data-frequency') : '';
    const ix = inode ? +inode.getAttribute('x') : 0;
    const iwidth = inode ? +inode.getAttribute('width') || 0 : 0;
    let result = false;
    switch (mode) {
      case 'inner':
        result = ix >= x && x + width > ix && x + width < ix + iwidth && iwidth !== 0;
        break;
      case 'containing':
        result = ix >= x && x + width > ix && x + width > ix + iwidth && iwidth !== 0;
        break;
      case 'touching':
        result = ix >= x && x + width === ix && iwidth !== 0;
        break;
    }
    if (brandname !== ibrandname || dose !== idose || frequency !== ifrequency && node !== inode) {
      return result;
    } else {
      return false;
    }
  }
  groupInGenericOverlaps(localOverlaps: any, globalOverlaps: any, node: any) {
    const uniqueItems = localOverlaps.map(lx => lx.item).filter((lx, li, arr) => arr.indexOf(lx) === li);
    for (const uniq of uniqueItems) {
      const targets = localOverlaps.filter(lx => lx.item === uniq);
      const coords = targets[0].item.split(';');

      const mainExculde = globalOverlaps.filter(gx => gx.x !== +coords[0] || gx.y !== +coords[1] || gx.width !== +coords[2]);
      const mainInclude = globalOverlaps.filter(gx => gx.x === +coords[0] && gx.y === +coords[1] && gx.width === +coords[2]);

      const tempExclude = mainInclude.filter(mx => JSON.stringify(mx.source) !== JSON.stringify(node.__data__));
      const tempInclude = mainInclude.filter(mx => JSON.stringify(mx.source) === JSON.stringify(node.__data__));

      let tempArray = [];
      for (const t of tempInclude) {
        tempArray = [...tempArray, ...t.targets];
      }
      const tempArray1 = targets.map(tx => tx.data);
      const tempArray2 = [];
      for (const t of tempArray) {
        if (tempArray1.filter(tx => JSON.stringify(tx) === JSON.stringify(t)).length === 0) {
          tempArray2.push(t);
        }
      }
      const pushObj = {
        x: +coords[0],
        y: +coords[1],
        width: +coords[2],
        source: node.__data__,
        targets: [...tempArray1, ...tempArray2]
      };
      globalOverlaps = [...mainExculde, ...tempExclude, pushObj];
    }
    return globalOverlaps;
  }
  calculateGlobalOverlaps(node: any, d: any, barWidth: number, self: MedicationsComponent,
    globalOverlaps: Array<any>, svg: any, i: number) {

    barWidth = self.calculateBarWidth(self, barWidth, d);
    const y = node ? +node.getAttribute('y') : 0;
    const rects = svg.selectAll('rect').nodes();
    if (rects && rects.length > 0) {
      const filter = rects.filter(x => (x ? +x.getAttribute('y') : 0) === y && +x.getAttribute('width') || 0 !== 0);
      if (filter && filter.length > 0) {
        let localOverlaps = [];
        localOverlaps = self.calculateIntersection(filter, node, barWidth, localOverlaps, 'inner', i);
        localOverlaps = self.calculateIntersection(filter, node, barWidth, localOverlaps, 'containing', i);
        localOverlaps = self.calculateIntersection(filter, node, barWidth, localOverlaps, 'touching', i);

        if (localOverlaps && localOverlaps.length > 0) {
          globalOverlaps = self.groupInGenericOverlaps(localOverlaps, globalOverlaps, node);
        }
      }
    }
    return { barWidth, globalOverlaps };
  }
  drawChart(allData: Array<any>, containterId, barColor, overlapColor, onClickCallback) {
    const self = this;
    const dataset = allData.filter(d => {
      const endDt = d.date.medEnd ? new Date(Date.parse(d.date.medEnd)) : this.chartState.xDomain.scaleMaxValue;
      return endDt >= this.chartState.xDomain.currentMinValue;
    });

    d3.selectAll('#' + containterId).selectAll('*').remove();

    const svg = d3
      .select('#' + containterId)
      .attr('class', containterId + '-elements-wrapper')
      .attr('transform', 'translate(0, 5)');

    const groups = dataset.map(x => x.medication.simpleGenericName[0]).filter((elem, index, arr) => arr.indexOf(elem) === index);
    const g = svg.append('g');
    const rectangles = g.selectAll('rect').data(dataset).enter();

    let globalOverlaps: any = [];
    const rectBars = rectangles
      .append('rect')
      .attr('rx', 0)
      .attr('ry', 0)
      .attr('height', 6)
      .attr('data-brandname', d => d.medication.name)
      .attr('data-dose', d => d.dose)
      .attr('data-frequency', d => d.frequency)
      .attr('stroke', 'none')
      .attr('fill', barColor)
      .style('cursor', 'pointer')
      .on('click', d => {
        onClickCallback(d);
      })
      .attr('x', d => {
        const medStartDate = Date.parse(d.date.medStart || d.date.orderDate);
        const pos = this.chartState.xScale(medStartDate);
        return pos < 0 ? 0 : pos - 1;
      })
      .attr('y', function (d: any, i) {
        for (let j = 0; j < groups.length; j++) {
          if (d.medication.simpleGenericName[0] === groups[j]) {
            return j * 27 + 12;
          }
        }
      })
      .attr('width', function (this: any, d: any, i: number) {
        let barWidth = 2; const node = this;
        ({ barWidth, globalOverlaps } = self.calculateGlobalOverlaps(node, d, barWidth, self, globalOverlaps, svg, i));
        return barWidth;
      });


    const labels = rectangles
      .append('text')
      .attr('class', containterId + '_text')
      .text((d, i) => d.medication.simpleGenericName[0])
      .attr('font-size', 10)
      .attr('text-anchor', 'start')
      .attr('text-height', 40)
      .attr('fill', 'black')
      .style('text-transform', 'capitalize')
      .style('cursor', 'pointer')
      .on('click', d => {
        onClickCallback(d);
      })
      .attr('x', d => {
        const medStartDate = Date.parse(d.date.medStart || d.date.orderDate);
        const medEndDate = this.getEndDate(d.date.medEnd);
        const width = this.chartState.xScale(medEndDate) - this.chartState.xScale(medStartDate);
        const pos = this.chartState.xScale(medStartDate);
        if (pos < 0) {
          return 0;
        } else if (pos >= this.chartsWidth) {
          return this.chartsWidth;
        } else {
          return pos;
        }
      })
      .attr('y', function (d: any, i) {
        for (let j = 0; j < groups.length; j++) {
          if (d.medication.simpleGenericName[0] === groups[j]) {
            return j * 27 + 8;
          }
        }
      });

    this.markGlobalOverlaps(globalOverlaps, svg, overlapColor);
    this.arrangeLabels(labels);

    d3.select('#' + containterId).attr('height', groups.length * 30);
    d3.select('#' + containterId).style('display', 'block');
  }
  markGlobalOverlaps(globalOverlaps: Array<any>, svg: any, overlapColor: any) {
    if (globalOverlaps && globalOverlaps.length > 0) {
      svg.append('g').selectAll('rect').data(globalOverlaps).enter().append('rect')
        .attr('rx', 0)
        .attr('ry', 0)
        .attr('x', d => d.x)
        .attr('y', d => d.y)
        .attr('width', d => d.width)
        .attr('height', 6)
        .attr('stroke', 'none')
        .attr('fill', overlapColor)
        .style('cursor', 'pointer')
        .on('click', (d: any) => {
          this.eventClientX = d.x;
          this.eventClientY = d.y;
          this.optionsData = {
            source: d.source,
            targets: d.targets
          };
          let theme, width;
          let aconfig = null;
          switch (d.source.type) {
            case this.medType.dmt:
              theme = 'ns-dmt-theme';
              width = '400px';
              aconfig = { top: `${d3.event.clientY - 140}px`, left: `${d3.event.clientX - 100}px` };
              break;
            case this.medType.vitaminD:
              theme = 'ns-vitaminD-theme';
              width = '400px';
              aconfig = { top: `${d3.event.clientY - 140}px`, left: `${d3.event.clientX - 100}px` };
              break;
            case this.medType.otherMeds:
              theme = 'ns-othermeds-theme';
              width = '600px';
              aconfig = { top: `${d3.event.clientY - 140}px`, left: `${d3.event.clientX - 100}px` };
              break;
          }
          const config = {
            hasBackdrop: true, panelClass: `${theme}`, width: `${width}`
          };
          this.dialogRef = this.dialog.open(this.secondLevelOptions, config);
          this.dialogRef.updatePosition(aconfig);
          this.dialogRef.afterClosed().subscribe(() => {
            this.optionsData = null;
          });
        });
    }
  }
  optionsClick(data: any) {
    this.dialogRef.close();
    switch (data.type) {
      case this.medType.dmt:
        data.dialogPosition = { top: `${this.eventClientY + 350}px`, left: `${this.eventClientX + 300}px` };
        this.noOfRelapses = '';
        this.brokerService.httpGetMany('DMT_SECOND_LAYER_RELAPSES', [
          {
            urlId: allHttpMessages.httpGetRelapse,
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
        ], data);

        this.brokerService.httpGet(allHttpMessages.httpGetDmt, [
          {
            name: 'pom_id',
            value: this.neuroGraphService.get('queryParams').pom_id
          }
        ], null, data);
        break;
      case this.medType.vitaminD:
        const config = { hasBackdrop: true, panelClass: 'ns-vitaminD-theme', width: '300px' };
        this.medSecondLayerModel = this.getSecondLayerModel(data, this.medType.vitaminD, false);
        this.dialogRef = this.dialog.open(this.vitaminDSecondLevelTemplate, config);
        this.dialogRef.updatePosition({ top: `${this.eventClientY + 400}px`, left: `${this.eventClientX + 300}px` });
        break;
      case this.medType.otherMeds:
        data.dialogPosition = { top: `${this.eventClientY + 425}px`, left: `${this.eventClientX + 300}px` };
        this.brokerService.httpGet(allHttpMessages.httpGetOtherMeds, [
          {
            name: 'pom_id',
            value: this.neuroGraphService.get('queryParams').pom_id
          }
        ], null, data);
        break;
    }
  }
  arrangeLabels(labels) {
    const yPositionsAll = [];
    labels.each((dCurrent, i, currentNodes) => {
      yPositionsAll.push(parseFloat(currentNodes[i].getAttribute('y')));
    });

    const yPositions = yPositionsAll.filter((elem, pos, arr) => arr.indexOf(elem) === pos);

    yPositions.forEach(pos => {
      const tempItems = [];
      labels.each((node, i, currentNodes) => {
        const current = currentNodes[i];
        const yPos = parseFloat(current.getAttribute('y'));
        if (pos === yPos) {
          tempItems.push(current);
        }
      });
      tempItems.forEach((node, i, currentNodes) => {
        if (i !== tempItems.length - 1) {
          const current = currentNodes[i];
          const txt = current.textContent;
          current.setAttribute('visibility', 'hidden');
        }
      });
    });
  }
  removeChart(containterId) {
    d3.selectAll('#' + containterId)
      .selectAll('*')
      .remove();
    d3.select('#' + containterId)
      .style('display', 'none');
  }
  enlargeMedicationPanel() {
    this.enlarge = !this.enlarge;
    this.enlargeMedicationParent.emit();
  }

  markOverlaps(rectBars, rectangles, overlapColor) {
    rectBars.each((d1, i, currentNodes) => {
      const current = currentNodes[i];
      const x1 = parseFloat(current.getAttribute('x'));
      const y1 = parseFloat(current.getAttribute('y'));
      const width1 = parseFloat(current.getAttribute('width'));

      rectBars.each((d2, j, nextNodes) => {
        const next = nextNodes[j];
        const x2 = parseFloat(next.getAttribute('x'));
        const y2 = parseFloat(next.getAttribute('y'));
        const width2 = parseFloat(next.getAttribute('width'));
        if (current !== next) {
          if (x1 > x2 && (x2 + width2) > x1 && y1 === y2) {
            const x = x1;
            const y = y1;
            const width = Math.abs(width2 - Math.abs(x2 - x1));
            rectangles
              .append('rect')
              .attr('rx', 0)
              .attr('ry', 0)
              .attr('x', x)
              .attr('y', y)
              .attr('width', width)
              .attr('height', 6)
              .attr('stroke', 'none')
              .attr('fill', overlapColor)
              .style('cursor', 'pointer');
          } else if (x1 > x2 && (x2 + width2) === x1 && y1 === y2) {
            const x = x1;
            const y = y1;
            rectangles
              .append('rect')
              .attr('rx', 0)
              .attr('ry', 0)
              .attr('x', x)
              .attr('y', y)
              .attr('width', 1)
              .attr('height', 6)
              .attr('stroke', 'none')
              .attr('fill', overlapColor)
              .style('cursor', 'pointer');
          }
        }
      });
    });
  }
}
