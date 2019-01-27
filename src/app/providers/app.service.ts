import { Injectable, OnInit } from '@angular/core';
import { Observable, Subscription, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AppService {
  private _loading: boolean;
  private loadingSubject = new Subject<boolean>();

  public loading$ = this.loadingSubject.asObservable();

  public set loading(loading: boolean) {
    this.loadingSubject.next(loading);
  }
  public get loading() {
    return this._loading;
  }

  constructor() {
    this.loading$.subscribe(loading => this._loading);
  }
}
