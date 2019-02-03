import { Injectable } from '@angular/core';
import { CompareTableOptions, WorkerEvent, MatchRowsOutput, RowBytes, ComparisonRow, Pagination, FileContentsEvent } from '../models';
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

  private pagination = new BehaviorSubject<Pagination>({ total: 0, page: 0, pageSize: 25 });
  pagination$ = this.pagination.asObservable();

  private rows = new BehaviorSubject<ComparisonRow[]>([]);
  rows$ = this.rows.asObservable();

  private headers = new BehaviorSubject<string[]>([]);
  headers$ = this.headers.asObservable();

  private _rowCache: RowCache = {};

  constructor(private electron: ElectronService, private log: LogService, private appService: AppService) {
    this.pagination$.subscribe(p => (this._pagination = p));
    this.resetPagination();
  }

  async changePage(page: number) {
    const pagination: Pagination = { ...this._pagination, page };
    this.pagination.next(pagination);
    await this.getRowsFromComparison(pagination);
  }

  async changePageSize(pageSize: number) {
    const pagination: Pagination = { ...this._pagination, pageSize };
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
    const end = Math.min(this.currBytesPerRow.length - 1, pagination.page * pagination.pageSize + pagination.pageSize + 1);
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
    this.electron.binaryClient.send(JSON.stringify({ name: 'COMPARE_TABLE', payload: { left: left, right: right, options } })).end();

    this.currentCompareResults = await this.waitForResults<MatchRowsOutput>();
    this.log.debug(this.currentCompareResults);
    this.pagination.next({ ...this._pagination, total: this.currentCompareResults.diffMetadata.matchedRowsCount });
    this.headers.next(Object.keys(this.currentCompareResults.colMetadata));
    this.currBytesPerRow = await this.electron.readFileAsJson<RowBytes[]>(this.currentCompareResults.files.bytesPerRow);
    this.log.timeEnd('compare data');
    await this.getRowsFromComparison();
  }

  /**
   * PRIVATE
   */

  private getRowCache(pagination?: Pagination) {
    const { page, pageSize } = pagination || this._pagination;
    return this._rowCache[`${page}+${pageSize}`];
  }

  private setRowCache(rows: ComparisonRow[], pagination?: Pagination) {
    const { page, pageSize } = pagination || this._pagination;
    this._rowCache[`${page}+${pageSize}`] = {
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
      page: 0,
      pageSize: 25,
    });
  }

  private waitForResults<T>(): Promise<T> {
    return new Promise(async (resolve, reject) => {
      this.electron.binaryClient.on('stream', readStream => {
        let parts = '';
        readStream.on('error', async err => {
          reject(err);
        });
        readStream.on('data', data => {
          this.log.debug('client:stream:data');
          parts += data;
        });
        readStream.on('end', async () => {
          this.log.debug('client:stream:end');
          const results: WorkerEvent<T> = JSON.parse(parts);
          this.log.debug('results', results);
          resolve(results.payload);
        });
      });
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
