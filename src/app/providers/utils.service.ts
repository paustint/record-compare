import { Injectable } from '@angular/core';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class UtilsService {
  constructor() {}

  getLanguage() {
    if (navigator.languages !== undefined) {
      return navigator.languages[0];
    } else {
      return navigator.language;
    }
  }

  unsubscribeAll(subscriptions: Subscription | Subscription[]) {
    if (Array.isArray(subscriptions)) {
      subscriptions.forEach(sub => sub.unsubscribe());
    } else if (subscriptions) {
      subscriptions.unsubscribe();
    }
  }
}
