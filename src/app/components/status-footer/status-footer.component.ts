import { Component, OnInit, Input } from '@angular/core';
import { DiffMetadata } from '../../models';
import { AppService } from '../../providers/app.service';
import { LogService } from '../../providers/log.service';

@Component({
  selector: 'app-status-footer',
  templateUrl: './status-footer.component.html',
  styleUrls: ['./status-footer.component.scss'],
})
export class StatusFooterComponent implements OnInit {
  @Input() tableDiffMetadata: DiffMetadata;
  loading$ = this.appService.loading$;
  footerItems$ = this.appService.footerItems$;

  constructor(private appService: AppService, private log: LogService) {}

  ngOnInit() {}
}
