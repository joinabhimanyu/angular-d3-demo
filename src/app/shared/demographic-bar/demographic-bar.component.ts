import {Component, OnInit} from '@angular/core';
import {SessionService, AuthenticationService} from '@sutterhealth/user-authentication';
import {EhrService, SupportService, MsService} from '@sutterhealth/data-services';
import {ActivityService} from '../services/activity/activity.service';
import {environment} from '../../../environments/environment';
import {AppointmentsService} from '../../core/services/appointments.service';
import {EvalModule, EvalService, EvalEventDirective} from '@sutterhealth/analytics';
import { NeuroGraphService } from 'app/neuro-graph/neuro-graph.module';

@Component({selector: 'demographic-bar', templateUrl: './demographic-bar.component.html', styleUrls: ['./demographic-bar.component.scss']})
export class DemographicBarComponent implements OnInit {
  public appConfig = environment;
  public userObject: any;
  public msStatus: any = {
    title: '',
    text: [],
    learn_more: ''
  };
  public msText: string = '';
  data: any = {};
  activity: any = {
    ege: '',
    age_of_onset: '',
    ms_type: 'Select',
    ms_status_1: 'Select',
    ms_status_2: 'Select'
  };
  public age: number;
  public typesArray: any[] = [
    {
      name: 'Select',
      value: 'Select'
    }, {
      name: 'RRMS - Relapsing-Remitting',
      value: 'Relapsing-Remitting'
    }, {
      name: 'PPMS - Primary Progressive',
      value: 'Primary Progressive'
    }, {
      name: 'SPMS - Secondary Progressive',
      value: 'Secondary Progressive'
    }, {
      name: 'PRMS - Progressive-Relapsing',
      value: 'Progressive-Relapsing'
    }, {
      name: 'CIS - Clinically Isolated Syndrome',
      value: 'Clinically Isolated Syndrome'
    }
  ];

  public statusDisease = [
    {
      name: 'Select',
      disabled: false
    }, {
      name: 'Active',
      disabled: false
    }, {
      name: 'Not Active',
      disabled: false
    }
  ];
  public statusType = [
    {
      name: 'Select',
      disabled: false
    }, {
      name: 'Progressive',
      disabled: false
    }, {
      name: 'Not Progressive',
      disabled: false
    }
  ];
  private pomId: string;
  public lastAppointmentWhitMe;
  public showTooltip: boolean = false;
  encunterClosed: boolean = false;
  msTypeTooltip: string;
  ageOfOnsetTooltip: string;
  msStatus1Tooltip: string;
  msStatus2Tooltip: string;
  patientName: string;
  public userType: any;

  constructor(private neuroGraphService: NeuroGraphService, private service: EhrService, 
    private support: SupportService, private session: SessionService, private activityService: ActivityService, 
    private auth: AuthenticationService, private msService: MsService, private appoService: AppointmentsService) {
    activityService
      .activityData$
      .subscribe(activityObject => {
        Object.assign(this.activity, activityObject);
      });
  }

  test() {
    this
      .neuroGraphService
      .pushObject();
  }

  ngOnInit() {

    this
      .session
      .getParams()
      .subscribe(params => {
        if (params['pom_id']) {
          this.pomId = params['pom_id'];

          this
            .session
            .getUser()
            .subscribe(user => {
              this.userObject = user;
              this
                .appoService.fetchAppointments('1', this.pomId, this.activityService.moment().
                subtract(2, 'years').format('MM/DD/YYYY', 'en', true), this.activityService.moment().
                add(6, 'months').format('MM/DD/YYYY', 'en', true), this.userObject.provider_id)
                .subscribe(appointments => {
                  this.lastAppointmentWhitMe = this
                    .appoService
                    .getLastAppointmentWhitMe();
                });
              this.userType = this.userObject.roles[0].role_name;

              if (this.userType !== 'PROVIDER') {
                this.encunterClosed = true;
              }

            });

          this
            .msService
            .getMSPatientData(this.pomId)
            .subscribe(data => {
              this.activity.age_of_onset = data.age_of_onset;
              this.activity.ms_type = data.ms_type;
              this.activity.ms_status_1 = data.ms_status_1;
              this.activity.ms_status_2 = data.ms_status_2;
              this.activity.age_of_onset_last_updated_instant = this
                .activityService
                .moment(new Date(data['age_of_onset_last_updated_instant']))
                .format('MM/DD/YYYY', 'en', true);
              this.activity.ms_type_last_updated_instant = this
                .activityService
                .moment(new Date(data['ms_type_last_updated_instant']))
                .format('MM/DD/YYYY', 'en', true);
              this.activity.ms_status_1_last_updated_instant = this
                .activityService
                .moment(new Date(data['ms_status_1_last_updated_instant']))
                .format('MM/DD/YYYY', 'en', true);
              this.activity.ms_status_2_last_updated_instant = this
                .activityService
                .moment(new Date(data['ms_status_2_last_updated_instant']))
                .format('MM/DD/YYYY', 'en', true);

              if (this.activity.age_of_onset === undefined && this.activity.ms_type === undefined && 
                this.activity.ms_status_1 === undefined && this.activity.ms_status_2 === undefined) {
                this.updateActivity('', true);
              }
            });

          this
            .msService
            .getMSPatientInfo()
            .subscribe(patInfo => {
              if (patInfo) {
                this.msStatus = patInfo;
                patInfo
                  .text
                  .forEach(item => {
                    this.msText += item + '\n ';
                  });
              }
            });

          this
            .service
            .getDemographicsM2(this.pomId)
            .subscribe(data => {
              if (data['EPIC']) {
                data = data['EPIC'];
                if (data.patientDemographics.name) {
                  let middle: string = '';
                  let title: string = '';
                  if (data.patientDemographics.name.middle.length > 0) {
                    middle = `, ${data
                      .patientDemographics
                      .name
                      .middle
                      .substr(0, 1)}`;
                  }
                  if (data.patientDemographics.name.title.length > 0) {
                    title = ` ${data.patientDemographics.name.title}`;
                  }
                  this.patientName = `${data.patientDemographics.name.last}${title},  ${data.patientDemographics.name.first}${middle}`;
                }
                if (data.patientDemographics.dateOfBirth) {
                  let date = data.patientDemographics.dateOfBirth;
                  const splitted = date.split('/');
                  const year = splitted[splitted.length - 1];
                  const currentYear = this
                    .activityService
                    .moment(new Date())
                    .format('YY', 'en', true);

                  if (currentYear < year) {
                    splitted[splitted.length - 1] = '19' + year;
                    date = splitted.join('/');
                  }
                  const dob = this
                    .activityService
                    .moment(new Date(date), 'MM/DD/YYYY')
                    .format('MM/DD/YYYY', 'en', true);
                  this.age = this
                    .activityService
                    .moment(new Date())
                    .diff(new Date(dob), 'years');
                  this.activity.age = this.age;
                }
                if (data.patientDemographics.sex) {
                  data.patientDemographics.sex = data
                    .patientDemographics
                    .sex
                    .substring(0, 1);
                }
                this.data = data.patientDemographics;
              }
            });

          if (params['csn_status'] && params['csn_status'] === 'Closed') {
            this.encunterClosed = true;
          }
        } else {
          this.data = {};
        }
      });
  }

  updateActivity(field_last_updated_instant: string, newRegister: boolean) {
    if (field_last_updated_instant !== '') {
      this.activity[field_last_updated_instant] = this
        .activityService
        .moment()
        .format('MM/DD/YYYY', 'en', true);
    }
    this.activity['pom_id'] = this.pomId;
    this
      .activityService
      .updateActivity(this.activity, this.encunterClosed, newRegister);
    this.updateTooltips();
  }

  toggleTooltip() {
    this.showTooltip = !this.showTooltip;
  }

  isValidKey(event) {
    const regex = new RegExp('^[0-9]');
    const key = String.fromCharCode(!event.charCode
      ? event.which
      : event.charCode);
    if (!regex.test(key) || this.activity['age_of_onset'].toString().length >= 2) {
      event.preventDefault();
      return false;
    }
  }

  updateTooltips() {
    this.msTypeTooltip = (this.activity.ms_type && this.activity.ms_type !== '-')
      ? `${this.activity.ms_type}\nEntered on: ${this.activity['ms_type_last_updated_instant']}`
      : '';
    this.ageOfOnsetTooltip = (this.activity.age_of_onset_last_updated_instant && 
      this.activity.age_of_onset && this.activity.age_of_onset !== '-')
      ? `Entered on: ${this.activity.age_of_onset_last_updated_instant}`
      : '';
    this.msStatus1Tooltip = (this.activity.ms_status_1_last_updated_instant && this.activity.ms_status_1 && 
      this.activity.ms_status_1 !== '-')
      ? `Entered on: ${this.activity.ms_status_1_last_updated_instant}`
      : '';
    this.msStatus2Tooltip = (this.activity.ms_status_2_last_updated_instant && this.activity.ms_status_2 && 
      this.activity.ms_status_2 !== '-')
      ? `Entered on: ${this.activity.ms_status_2_last_updated_instant}`
      : '';
  }
}
