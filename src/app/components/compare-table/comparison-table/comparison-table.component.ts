import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ViewChildren,
  QueryList,
  OnDestroy,
  ViewEncapsulation,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ComparisonRow, MatchRowsOutput, TableHeader } from '../../../models';
import { HeaderCellSizeDirective } from '../../../directives/header-cell-size.directive';
import { ScrollDispatcher, CdkScrollable } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { ContainerDirective } from '../../../directives/container.directive';
import { CHAR_TO_PIXEL_RATIO } from '../../../constants';
import * as _ from 'lodash';
import { LogService } from '../../../providers/log.service';
import { AppService } from '../../../providers/app.service';

@Component({
  selector: 'app-comparison-table',
  templateUrl: './comparison-table.component.html',
  styleUrls: ['./comparison-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ComparisonTableCdkComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren(HeaderCellSizeDirective) headerDirective: QueryList<HeaderCellSizeDirective>;
  @ViewChildren(ContainerDirective) containers: QueryList<ContainerDirective>;
  headersWithNumCol: String[];
  _headers: TableHeader[];
  @Input() scrollSync: boolean;
  @Input()
  set headers(headers: TableHeader[]) {
    this._headers = headers;
    this.headersWithNumCol = ['_#_'].concat(headers.map(item => item.label));
  }
  get headers() {
    return this._headers;
  }
  @Input() compareResults: MatchRowsOutput;
  @Input() rows: ComparisonRow[];

  scroll$: Subscription;

  constructor(private scrollService: ScrollDispatcher, private log: LogService, private appService: AppService) {}

  ngOnInit() {
    this.initScrollListener();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    if (this.scroll$) {
      this.scroll$.unsubscribe();
    }
  }

  getColWidth(col: string) {
    try {
      return `${this.compareResults.colMetadata[col].pixels}px`;
    } catch (ex) {
      return `${col.length * CHAR_TO_PIXEL_RATIO}px`;
    }
  }

  colHasDiffs(col: string) {
    try {
      return this.compareResults.colMetadata[col].hasDiffs;
    } catch (ex) {
      return false;
    }
  }

  private initScrollListener() {
    this.scroll$ = this.scrollService.scrolled().subscribe((scrollableEv: CdkScrollable) => {
      if (scrollableEv && this.scrollSync) {
        const scrollableId = scrollableEv.getElementRef().nativeElement.id;
        const nonScrolledContainer: ContainerDirective = this.containers.find(container => container.id !== scrollableId);
        if (nonScrolledContainer) {
          nonScrolledContainer.element.scrollTo({
            top: scrollableEv.measureScrollOffset('top'),
            left: scrollableEv.measureScrollOffset('left'),
          });
        }
      }
    });
  }

  trackBy(index: number, row: ComparisonRow) {
    return row.key || `${row.leftIndex}-${row.rightIndex}`;
  }
}
