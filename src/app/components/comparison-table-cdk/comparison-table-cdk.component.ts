import { Component, OnInit, Input, AfterViewInit, ViewChildren, QueryList, OnDestroy, ViewEncapsulation } from '@angular/core';
import { MatchRows, MatchRowsItem } from '../../models';
import { HeaderCellSizeDirective } from '../../directives/header-cell-size.directive';
import { ScrollDispatcher, CdkScrollable } from '@angular/cdk/scrolling';
import { Subscription } from 'rxjs';
import { ContainerDirective } from '../../directives/container.directive';
import { CHAR_TO_PIXEL_RATIO, NOOP } from '../../constants';
import * as _ from 'lodash';
import { LogService } from '../../providers/log.service';
import { AppService } from '../../providers/app.service';

interface TableRow {
  data: MatchRowsItem;
  index: number;
}

interface TableCell {
  value: string;
  diff: any[]; // TODO: figure this one out!
}

interface HeaderByName {
  [header: string]: HeaderCellSizeDirective;
}

interface HeaderMaxWidthByName {
  [header: string]: number;
}

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

  @Input() data: MatchRows;
  @Input()
  set maxHeight(height: number) {
    this.containerStyle.height = `${height}px`;
  }
  // Headers with "_#_" added as first element
  private _columns: string[];
  private _rows: TableRow[];

  visibleColumns: string[];
  visibleRows: TableRow[];

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
    this.initRows();
  }

  ngAfterViewInit() {}

  ngOnDestroy() {
    if (this.scroll$) {
      this.scroll$.unsubscribe();
    }
  }

  getColWidth(col: string) {
    try {
      return `${this.data.colMetadata[col].pixels}px`;
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

  private initRows() {
    this.appService.loading = true;
    this._rows = [];
    // this.rightRows = [];
    Object.keys(this.data.matchedRows).forEach((key, i) => {
      this._rows.push({
        data: this.data.matchedRows[key],
        index: i + 1,
      });
    });
    this.applyFilters();
    this.log.debug('_rows:', this._rows);
    this.appService.loading = false;
  }

  private getOption(name: OptionName): TableOption {
    return this.options.find(option => option.name === name);
  }

  // @DEPRECATED - added calculation as part of comparison
  // private setColWidth() {
  //   if (this.headerDirective) {
  //     setTimeout(() => {
  //       const left: HeaderByName = this.headerDirective.filter(header => header.name === 'left').reduce(this.groupHeaderByName, {});
  //       const right: HeaderByName = this.headerDirective.filter(header => header.name === 'right').reduce(this.groupHeaderByName, {});
  //       const maxWidth: HeaderMaxWidthByName = this.headers.reduce((headerWithMaxWidth: { [header: string]: number }, header) => {
  //         headerWithMaxWidth[header] = Math.max(left[header].getClientWidth(), right[header].getClientWidth());
  //         return headerWithMaxWidth;
  //       }, {});
  //       this.headers.forEach(header => {
  //         try {
  //           left[header].setWidth(maxWidth[header]);
  //           right[header].setWidth(maxWidth[header]);
  //         } catch (ex) {
  //           this.log.debug('Error setting width', ex);
  //         }
  //       });
  //     });
  //   }
  // }
  // @DEPRECATED - added calculation as part of comparison
  // private groupHeaderByName(byHeader: HeaderByName, header: HeaderCellSizeDirective): HeaderByName {
  //   byHeader[header.header] = header;
  //   return byHeader;
  // }

  trackBy(index: number, row: TableRow) {
    return row.index;
  }

  onOptionChange(option: TableOption) {
    option.value = !option.value;
    option.action();
  }

  applyFilters() {
    this.appService.loading = true;
    const hideMatchingRows = this.getOption('hideMatchingRows').value;
    const hideMatchingCols = this.getOption('hideMatchingCols').value;

    this.log.time('visibleRows');
    this.visibleRows = Array.isArray(this._rows) && hideMatchingRows ? this._rows.filter(row => row.data.hasDiffs) : this._rows;
    this.log.timeEnd('visibleRows');

    this.log.time('visibleColumns');
    this.visibleColumns =
      Array.isArray(this._columns) && hideMatchingCols
        ? this._columns.filter(col => {
            try {
              return col === '_#_' || this.data.colMetadata[col].hasDiffs;
            } catch (ex) {
              return false;
            }
          })
        : this._columns;
    this.log.timeEnd('visibleColumns');
    this.appService.loading = false;
  }
}
