import { Component, OnInit, Input, ViewChildren, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { ComparisonService } from '../../providers/comparison.service';
import { ComparisonRow, Pagination, MatchRowsOutput } from '../../models';
import { NOOP } from '../../constants';
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
  selector: 'app-compare-table-container',
  templateUrl: './compare-table-container.component.html',
  styleUrls: ['./compare-table-container.component.scss'],
})
export class CompareTableContainerComponent implements OnInit {
  @ViewChild('paginationDiv') paginationDiv: ElementRef<HTMLDivElement>;
  _contentHeight: number;
  @Input()
  set contentHeight(contentHeight: number) {
    this._contentHeight = contentHeight;
  }
  get contentHeight() {
    return this.calculateContentHeight();
  }

  compareResults: MatchRowsOutput;
  headers: string[];
  visibleHeaders: string[];
  rows: ComparisonRow[];
  visibleRows: ComparisonRow[];
  pagination: Pagination;
  paginationDivHeight = 35;
  scrollSync = true;
  hideMatchingRows = false;
  options: TableOption[] = [
    { name: 'scrollSync', label: 'Synchronize Scrolling', value: true, action: this.applyScrollsync.bind(this) },
    { name: 'hideMatchingRows', label: 'Hide Matching Rows', value: false, action: this.applyFilters.bind(this) },
    { name: 'hideMatchingCols', label: 'Hide Matching Columns', value: false, action: this.applyFilters.bind(this) },
  ];

  constructor(private comparisonService: ComparisonService, private log: LogService, private appService: AppService) {
    this.comparisonService.headers$.subscribe(headers => (this.headers = headers));
    this.comparisonService.rows$.subscribe(rows => {
      if (this.compareResults !== this.comparisonService.currentCompareResults) {
        this.compareResults = this.comparisonService.currentCompareResults;
        this.applyFooters();
      }
      this.rows = rows;
      this.applyFilters();
    });
    this.comparisonService.pagination$.subscribe(pagination => (this.pagination = pagination));
  }

  ngOnInit() {}

  paginate(ev: { first: number; rows: number; page: number; pageCount: number }) {
    if (ev.page !== this.pagination.page) {
      this.comparisonService.changePage(ev.page);
    }
    if (ev.rows !== this.pagination.pageSize) {
      this.comparisonService.changePageSize(ev.rows);
    }
  }

  calculateContentHeight() {
    const paginationHeight = this.paginationDiv ? this.paginationDiv.nativeElement.clientHeight : 35;
    return Math.max((this._contentHeight || 0) - paginationHeight, 300);
  }

  onOptionChange(option: TableOption) {
    option.value = !option.value;
    option.action();
  }

  applyScrollsync() {
    this.scrollSync = this.getOption('scrollSync').value;
  }

  applyFilters() {
    if (!this.rows || this.rows.length === 0) {
      return;
    }
    this.hideMatchingRows = this.getOption('hideMatchingRows').value;
    const hideMatchingCols = this.getOption('hideMatchingCols').value;

    this.log.time('visibleRows');
    const tempRows = Array.isArray(this.rows) && this.hideMatchingRows ? this.rows.filter(row => row.hasDiffs) : this.rows;
    // Extra records are obtained to allow showing more records upon gilter
    this.visibleRows = tempRows.slice(0, this.pagination.pageSize);
    this.log.timeEnd('visibleRows');

    this.log.time('visibleColumns');
    this.visibleHeaders =
      Array.isArray(this.headers) && hideMatchingCols
        ? this.headers.filter(col => {
            try {
              return col === '_#_' || this.compareResults.colMetadata[col].hasDiffs;
            } catch (ex) {
              return false;
            }
          })
        : this.headers;
    this.log.timeEnd('visibleColumns');
  }

  applyFooters() {
    if (this.compareResults && this.compareResults.diffMetadata) {
      const {
        diffCount,
        rowDiffCount,
        colDiffCount,
        cellDiffCount,
        leftRowCount,
        rightRowCount,
        leftDuplicateKeyCount,
        rightDuplicateKeyCount,
        leftRowsWithoutKeyCount,
        rightRowsWithoutKeyCount,
      } = this.compareResults.diffMetadata;
      this.appService.setFooterItems([
        [
          { isHeadingLabel: true, title: 'Differences' },
          {
            title: 'Total',
            hasValue: true,
            value: diffCount,
            valueClass: { 'text-danger': diffCount > 0, 'text-success': diffCount === 0 },
          },
          {
            title: 'Rows',
            hasValue: true,
            value: rowDiffCount,
            valueClass: { 'text-danger': rowDiffCount > 0, 'text-success': rowDiffCount === 0 },
          },
          {
            title: 'Columns',
            hasValue: true,
            value: colDiffCount,
            valueClass: { 'text-danger': colDiffCount > 0, 'text-success': colDiffCount === 0 },
          },
          {
            title: 'Cells',
            hasValue: true,
            value: cellDiffCount,
            valueClass: { 'text-danger': cellDiffCount > 0, 'text-success': cellDiffCount === 0 },
          },
        ],
        [
          { isHeadingLabel: true, title: 'Totals' },
          { title: 'Left Rows', hasValue: true, value: leftRowCount },
          { title: 'Right Rows', hasValue: true, value: rightRowCount },
          { title: 'Left Rows Skipped', hasValue: true, value: leftDuplicateKeyCount + leftRowsWithoutKeyCount || 0 },
          { title: 'Right Rows Skipped', hasValue: true, value: rightDuplicateKeyCount + rightRowsWithoutKeyCount || 0 },
        ],
      ]);
    }
  }

  private getOption(name: OptionName): TableOption {
    return this.options.find(option => option.name === name);
  }
}
