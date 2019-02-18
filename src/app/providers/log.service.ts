// tslint:disable:no-console
import { Injectable } from '@angular/core';
import { AppConfig } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class LogService {
  private logging: boolean;

  constructor() {
    this.logging = AppConfig.logging || false;
    this.debug('Logging Enabled:', this.logging);
  }

  toggleEnable(enable: boolean) {
    this.logging = enable;
  }

  private logTime() {
    if (this.logging) {
      return console.time.bind(console);
    } else {
      return function() {};
    }
  }
  private logTimeEnd() {
    if (this.logging) {
      return console.timeEnd.bind(console);
    } else {
      return function() {};
    }
  }

  private logOutput(which: 'error' | 'warn' | 'debug') {
    if (this.logging) {
      // only log based on configured level
      switch (which) {
        case 'error': {
          return console.error.bind(console);
        }
        case 'warn': {
          return console.warn.bind(console);
        }
        case 'debug': {
          return console.log.bind(console);
        }
        default: {
          return function() {};
        }
      }
    } else {
      return function() {};
    }
  }

  get error() {
    return this.logOutput('error');
  }
  get warn() {
    return this.logOutput('warn');
  }
  get debug() {
    return this.logOutput('debug');
  }

  get time() {
    return this.logTime();
  }

  get timeEnd() {
    return this.logTimeEnd();
  }
}
