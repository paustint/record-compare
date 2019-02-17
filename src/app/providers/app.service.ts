import { Injectable } from '@angular/core';
import { Subject, BehaviorSubject } from 'rxjs';
import { AppFooterItem, WorkerError, WorkerEventName, AppError } from '../models';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private _loading: boolean;

  private appError = new Subject<AppError | undefined>();
  public appError$ = this.appError.asObservable();

  private loadingSubject = new Subject<boolean>();
  public loading$ = this.loadingSubject.asObservable();

  private footerItems = new BehaviorSubject<AppFooterItem[][]>([]);
  public footerItems$ = this.footerItems.asObservable();

  public set loading(loading: boolean) {
    this.loadingSubject.next(loading);
  }
  public get loading() {
    return this._loading;
  }

  constructor(private log: LogService) {
    this.loading$.subscribe(loading => this._loading);
  }

  setFooterItems(items: AppFooterItem[][]) {
    this.log.debug('setFooterItems', items);
    this.footerItems.next(items);
  }

  onError(name: WorkerEventName, err: WorkerError) {
    this.appError.next({
      name,
      error: {
        name: err.name,
        message: err.message,
        data: err.data,
      },
    });
  }

  clearError() {
    this.appError.next();
  }
}
