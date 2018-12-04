import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { MdDialog, MdDialogRef } from '@angular/material';
import { FeedbackReportComponent } from '@sutterhealth/widgets';
import { SupportService, EhrService, MsService } from '@sutterhealth/data-services';
import { SessionService, AuthenticationService } from '@sutterhealth/user-authentication';
import { navBarOptions } from './core/config/nav-bar.config';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  showBar: boolean = true;
  menuOptionsTop: Array<Object> = navBarOptions.menuOptionsTop;
  menuOptionsBottom: Array<Object> = navBarOptions.menuOptionsBottom;

  constructor(private router: Router,
    public dialog: MdDialog,
    private sessionService: SessionService) { }

  ngOnInit() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        const url = event.url;
        if (url === '/unauthorized' || url === '/timeout') {
          this.showBar = false;
        } else {
          this.showBar = true;
        }
      }
    });
  }
  menuOptionClicked(option) {
    if (option.title === 'Send Feedback') {
      const dialogRef: MdDialogRef<FeedbackReportComponent> = this.dialog.open(FeedbackReportComponent, {
        height: '600px',
        width: '900px',
      });
    }
  }
}

