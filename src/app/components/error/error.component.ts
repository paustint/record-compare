import { Component, OnInit, Input } from '@angular/core';
import { AppService } from '../../providers/app.service';
import { WorkerError, WorkerEventName } from '../../models';
import { filter, map, tap } from 'rxjs/operators';
import { IconName, IconPrefix, SizeProp } from '@fortawesome/fontawesome-svg-core';

@Component({
  selector: 'app-error',
  templateUrl: './error.component.html',
  styleUrls: ['./error.component.scss'],
})
export class ErrorComponent implements OnInit {
  /**
   * If undefined, all events will be listened to
   */
  @Input() eventsToListenTo: WorkerEventName[];
  @Input() size: SizeProp = '3x';
  @Input() icon: [IconPrefix, IconName] = ['fal', 'exclamation-circle'];

  name: string;
  message: string;
  data?: any;

  constructor(private appService: AppService) {
    this.appService.appError$
      .pipe(
        tap(appError => {
          if (!appError) {
            this.name = undefined;
            this.message = undefined;
            this.data = undefined;
          }
        }),
        filter(appError => !!appError && (!this.eventsToListenTo || this.eventsToListenTo.includes(appError.name))),
        map(event => event.error)
      )
      .subscribe((workerError: WorkerError) => {
        this.name = workerError.name;
        this.message = workerError.message;
        this.data = workerError.data;
      });
  }

  ngOnInit() {}

  tootip() {
    return `${this.name}: ${this.message}`;
  }
}
