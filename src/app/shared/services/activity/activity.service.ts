import { Injectable } from '@angular/core';
import { Subject } from 'rxjs/Subject';
import { MsService } from '@sutterhealth/data-services';
import { MSPatientData } from '@sutterhealth/data-services/models/ms-patient-data.model';
import * as moment from 'moment';
import { ProgressNotesGeneratorService } from '@sutterhealth/progress-notes';

@Injectable()
export class ActivityService {

    private activitySource = new Subject<string>();
    private patientData: MSPatientData;
    moment: any;

    activityData$ = this.activitySource.asObservable();

    constructor(private msService: MsService, private progressNotesGenerator: ProgressNotesGeneratorService) {
        this.moment = (moment as any).default ? (moment as any).default : moment;
        this.moment.locale('en');
    }

    updateActivity(data: any, encunterClosed: boolean, newRegister: boolean) {
        if (data['ms_type'] === 'Select') {
            data['ms_type'] = '-';
        }
        if (data['ms_status_1'] === 'Select') {
            data['ms_status_1'] = '-';
        }
        if (data['ms_status_2'] === 'Select') {
            data['ms_status_2'] = '-';
        }
        if (!data['age_of_onset']) {
            data['age_of_onset'] = '-';
        }
        this.patientData = {
            pom_id: data.pom_id,
            age_of_onset: data.age_of_onset.toString(),
            last_updated_instant: moment().toString(),
            ms_type: data.ms_type,
            ms_status_1: data.ms_status_1,
            ms_status_2: data.ms_status_2,
            age_of_onset_last_updated_instant: data.age_of_onset_last_updated_instant,
            ms_type_last_updated_instant: data.ms_type_last_updated_instant,
            ms_status_1_last_updated_instant: data.ms_status_1_last_updated_instant,
            ms_status_2_last_updated_instant: data.ms_status_2_last_updated_instant
        };

        if (!encunterClosed) {
            const noteObject = {
                destination: 'progress-note',
                category: 'patient-data',
                source: 'demographic-bar',
                title: 'Patient Data',
                editable: true,
                draggable: false,
                data: this.getMarkup(data),
                timestamp: moment().toString(),
                overwrite: true
            };
            this.progressNotesGenerator.pushObject(noteObject);
        }

        if (newRegister) {
            this.msService.addMSPatientData(this.patientData).subscribe(result => {
                this.activitySource.next(data);
            });
        } else {
            this.msService.updateMSPatientData(this.patientData).subscribe(result => {
                this.activitySource.next(data);
            });
        }
    }

    getMarkup(data): string {
        return `<div><div class="title">Age:</div><div>${data['age']}</div></div>
            <div><div class="title">MS Type:</div><div>${data['ms_type']}</div></div>
            <div><div class="title">Status: </div><div>${data['ms_status_1']} ${data['ms_status_2']}</div></div>
            <div><div class="title">Age Of Onset:</div><div>${data['age_of_onset']}</div></div>`;
    }
}
