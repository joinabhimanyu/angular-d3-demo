import { Component, OnInit, OnDestroy, ChangeDetectorRef, ViewEncapsulation } from '@angular/core';
import { BrokerService } from '../broker/broker.service';
import { NeuroGraphService } from '../neuro-graph.service';
import { Observable } from 'rxjs/Observable';
import { MdDialog } from '@angular/material';
import { cdsMap, allMessages, allHttpMessages } from '../neuro-graph.config';
import { InfoPopupComponent } from './info-popup/info-popup.component';
import { ProgressNotesGeneratorService } from '@sutterhealth/progress-notes';

@Component({
  selector: 'app-cds', templateUrl: './cds.component.html', styleUrls:
    ['./cds.component.scss'], encapsulation: ViewEncapsulation.None
})
export class CdsComponent implements OnInit, OnDestroy {
  selectedCdsInfo: any = {};
  subscriptions: any;
  cdsInfo: any;
  cdsUserData: any;
  cdsState: any = {};
  csnState: any = {};
  cdsDataArrives: boolean = false;
  cdsForCsnExists: boolean = false;
  isEnable: boolean = false;
  constructor(private brokerService: BrokerService, private changeDetector: ChangeDetectorRef,
    private neuroGraphService: NeuroGraphService, public dialog: MdDialog,
    private progressNotesGeneratorService: ProgressNotesGeneratorService) {

    this.csnState.csn = this.neuroGraphService.get('queryParams').csn;
    this.csnState.encounterStatus = this.neuroGraphService.get('queryParams').csn_status;

    this.cdsState = {
      review_relapses: {
        checked: false
      },
      review_mri_images: {
        checked: false
      },
      review_symptom_status: {
        checked: false
      },
      review_ms_type_status: {
        checked: false
      },
      review_dmts: {
        checked: false
      },
      review_monitoring_labs: {
        checked: false
      },
      review_vitamin_d: {
        checked: false
      },
      review_other_meds: {
        checked: false
      },
      review_symptoms_referrals: {
        checked: false
      },
      review_vaccinations: {
        checked: false
      }
    };
  }

  ngOnInit() {
    this.subscriptions = this
      .brokerService
      .filterOn(allMessages.neuroRelated)
      .subscribe(d => {
        const cdsSource = d.data.artifact;
        const cdsTarget: [any] = cdsMap[cdsSource];
        const checked = d.data.checked;
        checked && (cdsTarget && cdsTarget.forEach(x => this.cdsState[x].checked = true));
        this.changeDetector.detectChanges();
        if (this.cdsDataArrives) {
          this.saveChkBoxesState();
        }
      });

    const sub1 = this
      .brokerService
      .filterOn(allHttpMessages.httpGetCdsInfo)
      .subscribe(d => {
        d.error
          ? console.log(d.error)
          : this.cdsInfo = d.data.cds || [];
      });

    const sub2 = this
      .brokerService
      .filterOn(allHttpMessages.httpGetCdsUserData)
      .subscribe(d => {
        this.isEnable = !this.csnState.encounterStatus || this.csnState.encounterStatus.toUpperCase() !== 'CLOSED';
        d.error
          ? console.log(d.error)
          : (() => {
            try {
              this.cdsDataArrives = true;
              this.cdsUserData = d.data.cds || [];
              this.cdsUserData = this.cdsUserData
                .filter(x => x.save_csn === this.csnState.csn)
                .map(item => {
                  return {
                    ...item,
                    lastUpdateDate: new Date(item.last_updated_instant)
                  };
                })
                .sort((a, b) => b.lastUpdateDate - a.lastUpdateDate);

              if (this.cdsUserData.length > 0) {
                this.cdsUserData = this.cdsUserData[0];
                this.setChkBoxes();
                this.cdsForCsnExists = true;
              }
            } catch (ex) {
              console.log(ex);
              this.brokerService.emit(allMessages.showLogicalError, 'CDS');
            }
          })();
      });

    const sub3 = this
      .brokerService
      .filterOn(allHttpMessages.httpPutCdsUserData)
      .subscribe(d => d.error ? console.log(d.error) : (() => {
        //
      })());

    const sub4 = this
      .brokerService
      .filterOn(allHttpMessages.httpPostCdsUserData)
      .subscribe(d => {
        d.error ? console.log(d.error) : (() => {
          this.cdsForCsnExists = true;
        })();
      });

    const sub5 = this
      .brokerService
      .filterOn(allMessages.demographicEnableCheckBox)
      .subscribe(d => d.error
        ? console.log(d.error)
        : (() => {
          this.cdsState.review_ms_type_status.checked = true;
          if (this.cdsDataArrives) {
            this.saveChkBoxesState();
          }
        })());

    this.brokerService.httpGet(allHttpMessages.httpGetCdsInfo);
    this.brokerService.httpGet(allHttpMessages.httpGetCdsUserData, [
      {
        name: 'pom_id',
        value: this.neuroGraphService.get('queryParams').pom_id
      }
    ]);

    this.subscriptions
      .add(sub1)
      .add(sub2)
      .add(sub3)
      .add(sub4)
      .add(sub5);
  }

  saveChkBoxesState() {
    if (this.cdsForCsnExists) {
      this.brokerService.httpPut(allHttpMessages.httpPutCdsUserData, this.getCdsStateData());
    } else {
      this.brokerService.httpPost(allHttpMessages.httpPostCdsUserData, this.getCdsStateData());
    }
  }
  getCdsStateData() {
    const cdsStateData: any = {};
    Object
      .keys(this.cdsState)
      .forEach(x => {
        this;
        if (this.cdsState[x].checked) {
          cdsStateData[x] = 'Yes';
        } else {
          cdsStateData[x] = 'No';
        }
      });

    cdsStateData.pom_id = this.neuroGraphService.get('queryParams').pom_id;
    cdsStateData.provider_id = this.neuroGraphService.get('queryParams').provider_id;
    cdsStateData.save_csn = this.neuroGraphService.get('queryParams').csn;
    cdsStateData.save_csn_status = this.neuroGraphService.get('queryParams').csn_status;

    return (cdsStateData);
  }

  setChkBoxes() {
    Object.keys(this.cdsUserData).map(x => {
      this.cdsState[x] && (this.cdsState[x].checked = ((this.cdsUserData[x] === 'Yes')
        || (this.cdsUserData[x] === 'yes') || (this.cdsState[x].checked)) ? true : false);
    });
    this.changeDetector.detectChanges();
  }

  changed(event, item) {
    this.saveChkBoxesState();
  }

  openDialog(e, infoTitle) {
    const x = e.clientX;
    const y = e.clientY;
    this.selectedCdsInfo = this
      .cdsInfo
      .find(item => item.label === infoTitle);
    const dialogRef = this
      .dialog
      .open(InfoPopupComponent, {
        backdropClass: 'cds-info-popup-backdrop',
        panelClass: 'cds-info-popup',
        width: '300px',
        data: {
          info: this.selectedCdsInfo,
          x: x,
          y: y
        }
      });
  }

  progressNotes() {
    const timestamp = this
      .neuroGraphService
      .moment()
      .toString();
    this
      .progressNotesGeneratorService
      .pushObject({
        destination: 'progress-note',
        category: 'progress-note',
        source: 'MS-related-care',
        title: 'MS related care',
        editable: false,
        draggable: true,
        data: this.getMarkup(),
        timestamp: timestamp,
        overwrite: true
      });
  }

  getMarkup() {
    return (`
      <h2>Information provided by clinician in MS related care</h2>
    `);
  }

  ngOnDestroy() {
    this
      .subscriptions
      .unsubscribe();
  }
}
