import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { ComparisonService } from '../../providers/comparison.service';
import { ComparisonRow, Pagination, MatchRowsOutput, TableHeader } from '../../models';
import { LogService } from '../../providers/log.service';
import { AppService } from '../../providers/app.service';
import { StateService } from '../../providers/state.service';
import { Subscription } from 'rxjs';
import { UtilsService } from '../../providers/utils.service';
import { ElectronService } from '../../providers/electron.service';

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
export class CompareTableContainerComponent implements OnInit, OnDestroy {
  compareResults: MatchRowsOutput;
  headers: TableHeader[];
  visibleHeaders: TableHeader[];
  rows: ComparisonRow[];
  visibleRows: ComparisonRow[];
  pagination: Pagination;
  scrollSync = true;
  hideMatchingRows = false;
  options: TableOption[] = [
    { name: 'scrollSync', label: 'Synchronize Scrolling', value: true, action: this.applyScrollsync.bind(this) },
    { name: 'hideMatchingRows', label: 'Hide Matching Rows', value: false, action: this.applyFilters.bind(this) },
    { name: 'hideMatchingCols', label: 'Hide Matching Columns', value: false, action: this.applyFilters.bind(this) },
  ];
  subscriptions: Subscription[] = [];

  constructor(
    private stateService: StateService,
    private comparisonService: ComparisonService,
    private log: LogService,
    private appService: AppService,
    private utils: UtilsService,
    private electron: ElectronService,
    private cd: ChangeDetectorRef
  ) {
    this.stateService.restoreState('compareFilesTable', this);
    this.subscriptions.push(this.comparisonService.headers$.subscribe(headers => (this.headers = headers)));
    this.subscriptions.push(
      this.comparisonService.rows$.subscribe(rows => {
        if (this.compareResults !== this.comparisonService.currentCompareResults) {
          this.compareResults = this.comparisonService.currentCompareResults;
          this.applyFooters();
        }
        this.rows = rows;
        this.applyFilters();
      })
    );
    this.subscriptions.push(this.comparisonService.pagination$.subscribe(pagination => (this.pagination = pagination)));
  }

  ngOnInit() {
    // if (this.stateService.restoreState('compareFilesTable', this)) {
    //   this.cd.detectChanges();
    // }
  }

  ngOnDestroy() {
    this.stateService.setState('compareFilesTable', {
      compareResults: this.compareResults,
      headers: this.headers,
      visibleHeaders: this.visibleHeaders,
      rows: this.rows,
      visibleRows: this.visibleRows,
      pagination: this.pagination,
      scrollSync: this.scrollSync,
      hideMatchingRows: this.hideMatchingRows,
    });
    this.utils.unsubscribeAll(this.subscriptions);
  }

  paginate(ev: { first: number; rows: number; page: number; pageCount: number }) {
    this.comparisonService.paginate(ev.page, ev.rows);
  }

  onOptionChange(option: TableOption) {
    option.value = !option.value;
    option.action();
  }

  async saveFile() {
    this.appService.loading = true;
    const outputFilename = this.electron.dialog.showSaveDialog(this.electron.remote.getCurrentWindow(), {
      title: 'Save File Export',
      defaultPath: this.electron.path.join(this.electron.downloadsPath, 'record-compare-export.xlsx'),
      filters: [{ name: 'Spreadsheets', extensions: ['xlsx'] }],
    });

    await this.electron.sendEventToWorker('EXPORT_COMPARISON', {
      inputFilename: this.compareResults.files.comparison,
      outputFilename,
    });
    this.appService.loading = false;
    this.electron.remote.shell.openItem(outputFilename);
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
              return col.label === '_#_' || this.compareResults.colMetadata[col.label].hasDiffs;
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
          { isHeadingLabel: true, title: 'Differences', hasValue: false },
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
          { isHeadingLabel: true, title: 'Totals', hasValue: false },
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
