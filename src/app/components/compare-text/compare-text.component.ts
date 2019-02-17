import { Component, OnInit, Input, OnChanges, SimpleChanges, OnDestroy, ViewChild, AfterViewInit } from '@angular/core';
import { DiffContent, DiffResults } from 'ngx-text-diff/lib/ngx-text-diff.model';
import { Subject, Subscription } from 'rxjs';
import { ElectronService } from '../../providers/electron.service';
import { LogService } from '../../providers/log.service';
import { ContainerDirective } from '../../directives/container.directive';
import { CalculateHeightDirective } from '../../directives/calculate-height.directive';
import { AppService } from '../../providers/app.service';

@Component({
  selector: 'app-compare-text',
  templateUrl: './compare-text.component.html',
  styleUrls: ['./compare-text.component.scss'],
})
export class CompareTextComponent implements OnInit, AfterViewInit, OnChanges, OnDestroy {
  @ViewChild(CalculateHeightDirective) appContainer: CalculateHeightDirective;
  @Input() left: string;
  @Input() right: string;
  @Input() leftFile: string;
  @Input() rightFile: string;

  diffContentSubject = new Subject<DiffContent>();
  diffContent$ = this.diffContentSubject.asObservable();
  diffResults: DiffResults;

  compareRowsStyle = {
    'max-height': '100%',
  };

  appContainerSubscription: Subscription;

  constructor(private electron: ElectronService, private log: LogService, private appService: AppService) {}

  ngOnInit() {}

  ngAfterViewInit() {
    const OTHER_UI_ELEMENTS_HEIGHT = 40;
    this.appContainerSubscription = this.appContainer.onHeightChange$.subscribe(containerHeight => {
      this.compareRowsStyle['max-height'] = `${containerHeight - OTHER_UI_ELEMENTS_HEIGHT}px`;
    });
  }

  ngOnDestroy() {
    if (this.appContainerSubscription) {
      this.appContainerSubscription.unsubscribe();
    }
    if (this.diffResults) {
      this.appService.setFooterItems([]);
    }
  }

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.leftFile && changes.leftFile.currentValue !== changes.leftFile.previousValue) {
      this.log.debug('Reading leftFile', changes.leftFile.currentValue);
      this.left = await this.electron.fs.readFile(changes.leftFile.currentValue, 'utf-8');
    }
    if (changes.rightFile && changes.rightFile.currentValue !== changes.rightFile.previousValue) {
      this.log.debug('Reading rightFil', changes.rightFile.currentValue);
      this.right = await this.electron.fs.readFile(changes.rightFile.currentValue, 'utf-8');
    }
    if (this.left && this.right) {
      this.diffContentSubject.next({
        leftContent: this.left,
        rightContent: this.right,
      });
    }
  }

  onCompareResults(diffResults: DiffResults) {
    this.diffResults = diffResults;
    this.appService.setFooterItems([
      [
        { isHeadingLabel: true, title: 'Differences', hasValue: false },
        {
          title: 'Files Match',
          hasValue: true,
          value: !diffResults.hasDiff,
          valueClass: { 'text-danger': diffResults.hasDiff, 'text-success': !diffResults.hasDiff },
        },
        {
          title: 'Non-Matching Lines',
          hasValue: true,
          value: diffResults.diffsCount,
          valueClass: { 'text-danger': diffResults.diffsCount > 0, 'text-success': diffResults.diffsCount === 0 },
        },
      ],
    ]);
  }
}
