import { Component, OnInit } from '@angular/core';
import { EvalService } from '@sutterhealth/analytics';

@Component({
  selector: 'app-progress-note',
  templateUrl: './progress-note.component.html',
  styleUrls: ['./progress-note.component.scss']
})
export class ProgressNoteComponent implements OnInit {

  constructor(private evalService: EvalService) { }

  ngOnInit() {
  }
}
