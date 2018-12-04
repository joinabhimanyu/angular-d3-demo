import { Injectable } from '@angular/core';

@Injectable()
export class NotesService {

  public clinicalNotes: string = '';
 public noteBuilder: string = '';
  constructor() {

  }
  getClinicalNotes(): string {
    return this.clinicalNotes;
  }

}
