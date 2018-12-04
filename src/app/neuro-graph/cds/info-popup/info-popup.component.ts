import { Component, OnInit, Inject, ViewEncapsulation } from '@angular/core';
import { MdDialog, MdDialogConfig, MdDialogRef, MD_DIALOG_DATA } from '@angular/material';

@Component({
  selector: 'app-info-popup',
  templateUrl: './info-popup.component.html',
  styleUrls: ['./info-popup.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class InfoPopupComponent implements OnInit {

  displayInfo: any;
  x: any;
  y: any;

  constructor(public dialogRef: MdDialogRef<InfoPopupComponent>, @Inject(MD_DIALOG_DATA) public data: any) {
    this.displayInfo = data.info;
    const label = this.displayInfo.label;
    this.x = data.x - 315;
    if (label === 'review_vitamin_d') {
      this.y = data.y - 175;
    } else if (label === 'review_ms_type_status') {
      this.y = data.y - 100;
    } else if (label === 'review_dmts') {
      this.y = data.y - 100;
    } else if (label === 'review_monitoring_labs') {
      this.y = data.y - 100;
    } else if (label === 'review_symptoms_referrals') {
      this.y = data.y - 160;
    } else if (label === 'review_other_meds') {
      this.y = data.y - 160;
    } else if (label === 'review_vaccinations') {
      this.y = data.y - 400;
    } else {
      this.y = data.y;
    }
  }

  closeDialog() {
    this.dialogRef.close();
  }

  ngOnInit() {
    const topMargin = this.y + 'px';
    const leftMargin = this.x + 'px';
    this.dialogRef.updatePosition({ top: topMargin, left: leftMargin });
  }

}
