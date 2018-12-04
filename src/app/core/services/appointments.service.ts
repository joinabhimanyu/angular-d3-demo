import { Injectable } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { ProviderService } from '@sutterhealth/data-services';
import * as _ from 'lodash';

@Injectable()
export class AppointmentsService {
    appointmentsList;
    completedAppointments: any[];
    lastAppointment;
    lastAppointmentWhitMe;
    data: Observable<any>;
    constructor(private providerService: ProviderService) { }

    fetchAppointments(idType: string, id: string, startDate: string, endDate: string, providerId: string): Observable<any> {
        this.data = new Observable(observer => {
            this.providerService.getAppointments(idType, id, startDate, endDate).subscribe(appointments => {
                this.completedAppointments = [];
                this.lastAppointment = {};
                this.completedAppointments = _.filter(appointments, function (value: any) {
                    return value.status === 'Completed';
                });
                this.lastAppointmentWhitMe = _.filter(this.completedAppointments, function (appt) {
                    return appt.provider.id === providerId;
                });
                this.lastAppointmentWhitMe = _.first(this.lastAppointmentWhitMe);
                this.lastAppointment = _.first(this.completedAppointments);
                observer.next();
            });
        });
        return this.data;
    }
    getAppointments() {
        return this.appointmentsList;
    }
    getLastAppointment() {
        this.lastAppointment;
    }
    getLastAppointmentWhitMe() {
        return this.lastAppointmentWhitMe;
    }
}