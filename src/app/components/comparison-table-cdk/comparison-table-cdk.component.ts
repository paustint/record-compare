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
import { MatchRowsItem, ComparisonRow, MatchRowsOutput } from '../../models';
import { HeaderCellSizeDirective } from '../../directives/header-cell-size.directive';
import { ScrollDispatcher, CdkScrollable } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { ContainerDirective } from '../../directives/container.directive';
import { CHAR_TO_PIXEL_RATIO, NOOP } from '../../constants';
import * as _ from 'lodash';
import { LogService } from '../../providers/log.service';
import { AppService } from '../../providers/app.service';

interface TableOption {
  name: OptionName;
  label: string;
  value: boolean;
  action: Function;
}

type OptionName = 'scrollSync' | 'hideMatchingRows' | 'hideMatchingCols';

@Component({
  selector: 'app-comparison-table-cdk',
  templateUrl: './comparison-table-cdk.component.html',
  styleUrls: ['./comparison-table-cdk.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
})
export class ComparisonTableCdkComponent implements OnInit, AfterViewInit, OnDestroy {
  @ViewChildren(HeaderCellSizeDirective) headerDirective: QueryList<HeaderCellSizeDirective>;
  @ViewChildren(ContainerDirective) containers: QueryList<ContainerDirective>;
  _headers: string[];
  @Input()
  set headers(headers: string[]) {
    this._headers = headers;
    if (headers[0] !== '_#_') {
      this._columns = ['_#_'].concat(headers);
    } else {
      this._columns = headers;
    }
    if (this.isInit) {
      this.applyFilters();
    }
  }
  get headers(): string[] {
    return this._headers;
  }
  @Input() compareResults: MatchRowsOutput;
  @Input()
  set rows(rows: ComparisonRow[]) {
    this._rows = rows;
    this.applyFilters();
  }
  get rows() {
    return this._rows;
  }
  @Input()
  set maxHeight(height: number) {
    this.containerStyle.height = `${height}px`;
  }
  // Headers with "_#_" added as first element
  private _columns: string[];
  private _rows: ComparisonRow[];
  visibleColumns: string[];
  visibleRows: ComparisonRow[];

  scroll$: Subscription;

  options: TableOption[] = [
    { name: 'scrollSync', label: 'Synchronize Scrolling', value: true, action: NOOP.bind(this) },
    { name: 'hideMatchingRows', label: 'Hide Matching Rows', value: false, action: this.applyFilters.bind(this) },
    { name: 'hideMatchingCols', label: 'Hide Matching Columns', value: false, action: this.applyFilters.bind(this) },
  ];

  containerStyle = {
    height: '500px',
  };
  isInit = false;

  constructor(private scrollService: ScrollDispatcher, private log: LogService, private appService: AppService) {}

  ngOnInit() {
    this.isInit = true;
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

  private initScrollListener() {
    this.scroll$ = this.scrollService.scrolled().subscribe((scrollableEv: CdkScrollable) => {
      if (scrollableEv && this.getOption('scrollSync').value) {
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

  private getOption(name: OptionName): TableOption {
    return this.options.find(option => option.name === name);
  }

  trackBy(index: number, row: ComparisonRow) {
    return row.key;
  }

  onOptionChange(option: TableOption) {
    option.value = !option.value;
    option.action();
  }

  applyFilters() {
    const hideMatchingRows = this.getOption('hideMatchingRows').value;
    const hideMatchingCols = this.getOption('hideMatchingCols').value;

    this.log.time('visibleRows');
    this.visibleRows = Array.isArray(this.rows) && hideMatchingRows ? this.rows.filter(row => row.hasDiffs) : this.rows;
    this.log.timeEnd('visibleRows');

    this.log.time('visibleColumns');
    this.visibleColumns =
      Array.isArray(this._columns) && hideMatchingCols
        ? this._columns.filter(col => {
            try {
              return col === '_#_' || this.compareResults.colMetadata[col].hasDiffs;
            } catch (ex) {
              return false;
            }
          })
        : this._columns;
    this.log.timeEnd('visibleColumns');
  }
}
