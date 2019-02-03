import { Injectable, OnInit } from '@angular/core';
import { Observable, Subscription, Subject, BehaviorSubject } from 'rxjs';
import { AppFooterItem } from '../models';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private _loading: boolean;

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
}
