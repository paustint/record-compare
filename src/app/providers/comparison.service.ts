import { Injectable } from '@angular/core';
import {
  CompareTableOptions,
  WorkerEvent,
  MatchRowsOutput,
  RowBytes,
  ComparisonRow,
  Pagination,
  FileContentsEvent,
  TableHeader,
} from '../models';
import { LogService } from './log.service';
import { ElectronService } from './electron.service';
import { BehaviorSubject } from 'rxjs';
import { AppService } from './app.service';
interface RowCache {
  [key: string]: {
    page: number;
    pageSize: number;
    rows: ComparisonRow[];
  };
}
@Injectable({
  providedIn: 'root',
})
export class ComparisonService {
  currentCompareResults: MatchRowsOutput;
  currBytesPerRow: RowBytes[];
  currentRows: ComparisonRow[] = [];

  private _pagination: Pagination;

  private pagination = new BehaviorSubject<Pagination>({ total: 0, totalDiffs: 0, page: 0, pageSize: 25 });
  pagination$ = this.pagination.asObservable();

  private rows = new BehaviorSubject<ComparisonRow[]>([]);
  rows$ = this.rows.asObservable();

  private headers = new BehaviorSubject<TableHeader[]>([]);
  headers$ = this.headers.asObservable();

  private _rowCache: RowCache = {};

  constructor(private electron: ElectronService, private log: LogService, private appService: AppService) {
    this.pagination$.subscribe(p => (this._pagination = p));
    this.resetPagination();
  }

  async paginate(page: number, pageSize: number) {
    const pagination: Pagination = { ...this._pagination, page, pageSize };
    this.pagination.next(pagination);
    await this.getRowsFromComparison(pagination);
  }

  /**
   * Based on pagination, get rows for comparison
   */
  async getRowsFromComparison(pagination?: Pagination) {
    pagination = pagination || this._pagination;
    const cachedRows = this.getRowCache(pagination);
    if (cachedRows) {
      this.rows.next(cachedRows.rows);
      this.currentRows = cachedRows.rows;
      return cachedRows.rows;
    }
    this.appService.loading = true;
    const start = Math.min(this.currBytesPerRow.length - 1, pagination.page * pagination.pageSize + 1);
    const end = Math.min(this.currBytesPerRow.length - 1, pagination.page * (pagination.pageSize * 2) + pagination.pageSize + 1);
    const parseResults = await this.electron.readFileAsCsv(this.currentCompareResults.files.comparison, {
      readChunk: {
        header: { start: this.currBytesPerRow[0].start, end: this.currBytesPerRow[0].end },
        data: { start: this.currBytesPerRow[start].start, end: this.currBytesPerRow[end].end },
      },
      transform: this.transformCompareCsv.bind(this),
    });
    // FIXME: handle parse errors
    this.setRowCache(parseResults.data, pagination);
    this.currentRows = parseResults.data;
    this.rows.next(this.currentRows);
    this.appService.loading = false;
    this.log.debug('currentRows', this.currentRows);
    return this.currentRows;
  }

  /**
   *
   *  Compare two CSVs - work is performed in worker thread
   *
   * @param left
   * @param right
   * @param options
   */
  async compareTableData(left: FileContentsEvent, right: FileContentsEvent, options: CompareTableOptions) {
    this.appService.loading = true;
    this.resetComparison();
    this.log.time('compare data');
    try {
      this.currentCompareResults = await this.electron.sendEventToWorker('COMPARE_TABLE', { left: left, right: right, options });

      try {
        this.pagination.next({
          ...this._pagination,
          total: this.currentCompareResults.diffMetadata.matchedRowsCount,
          totalDiffs: this.currentCompareResults.diffMetadata.rowDiffCount,
        });

        const headers = Object.keys(this.currentCompareResults.mapping).map(key => ({
          label: key,
          origLabel: this.currentCompareResults.mapping[key],
        }));

        this.headers.next(headers);
        this.currBytesPerRow = await this.electron.readFileAsJson<RowBytes[]>(this.currentCompareResults.files.bytesPerRow);

        await this.getRowsFromComparison();
      } catch (ex) {
        // Error reading results
        this.log.error(ex);
        this.appService.loading = false;
        this.resetComparison();
      }
    } catch (ex) {
      // error comparing data
      this.log.error(ex);
      this.appService.loading = false;
      this.appService.onError('COMPARE_TABLE', ex);
      this.resetComparison();
    } finally {
      this.log.timeEnd('compare data');
    }
  }

  /**
   * PRIVATE
   */

  private getRowCache(pagination?: Pagination, hideMatchingRows = false) {
    const { page, pageSize } = pagination || this._pagination;
    return this._rowCache[`${page}+${pageSize}+${hideMatchingRows ? 'hidematch' : 'all'}`];
  }

  private setRowCache(rows: ComparisonRow[], pagination?: Pagination, hideMatchingRows = false) {
    const { page, pageSize } = pagination || this._pagination;
    this._rowCache[`${page}+${pageSize}+${hideMatchingRows ? 'hidematch' : 'all'}`] = {
      page,
      pageSize,
      rows,
    };
    this.log.debug('set row cache', this._rowCache);
  }

  private resetComparison() {
    this.currentCompareResults = undefined;
    this.currBytesPerRow = undefined;
    this.currentRows = [];
    this.resetPagination();
    this._rowCache = {};
    this.rows.next([]);
  }

  private resetPagination() {
    this.pagination.next({
      total: 0,
      totalDiffs: 0,
      page: 0,
      pageSize: 25,
    });
  }

  private transformCompareCsv(value: string, field: string | number) {
    try {
      switch (field) {
        case 'hasDiffs': {
          return value.startsWith('t') ? true : false;
        }
        case 'key': {
          return value;
        }
        case 'leftIndex': {
          return Number(value);
        }
        case 'rightIndex': {
          return Number(value);
        }
        case 'left': {
          if (value.startsWith('{')) {
            return JSON.parse(value);
          }
          return {};
        }
        case 'right': {
          if (value.startsWith('{')) {
            return JSON.parse(value);
          }
          return {};
        }
        default:
          return value;
      }
    } catch (ex) {
      this.log.debug('Error transforming', field, value);
      this.log.debug(ex);
      return value;
    }
  }
}
