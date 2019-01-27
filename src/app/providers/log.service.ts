// tslint:disable:no-console
import { Injectable, Optional } from '@angular/core';
import { environment } from '../environments/environments';

export enum LogLevels {
  OFF = 0,
  ERROR = 1,
  WARN = 2,
  INFO = 3,
  DEBUG = 4,
}

@Injectable({
  providedIn: 'root',
})
export class LogService {
  level: number;

  constructor() {
    this.level = environment.logLevel || 0;
  }

  private logTime(level: number) {
    if (level <= this.level) {
      // only log based on configured level
      switch (level) {
        case 4:
          return console.time.bind(console);
        // break;
        default:
          return function() {};
      }
    } else {
      return function() {};
    }
  }
  private logTimeEnd(level: number) {
    if (level <= this.level) {
      // only log based on configured level
      switch (level) {
        case 4:
          return console.timeEnd.bind(console);
        // break;
        default:
          return function() {};
      }
    } else {
      return function() {};
    }
  }

  private logOutput(level: number) {
    if (level <= this.level) {
      // only log based on configured level
      switch (level) {
        case 1:
          return console.error.bind(console);
        // break;
        case 2:
          return console.warn.bind(console);
        // break;
        case 3:
          return console.log.bind(console);
        case 4:
          return console.log.bind(console);
        // break;
        default:
          return function() {};
      }
    } else {
      return function() {};
    }
  }
  // alias for debug
  get log() {
    return this.logOutput(LogLevels.DEBUG);
  }
  get error() {
    return this.logOutput(LogLevels.ERROR);
  }
  get warn() {
    return this.logOutput(LogLevels.WARN);
  }
  get info() {
    return this.logOutput(LogLevels.INFO);
  }
  get debug() {
    return this.logOutput(LogLevels.DEBUG);
  }

  get time() {
    return this.logTime(LogLevels.DEBUG);
  }

  get timeEnd() {
    return this.logTimeEnd(LogLevels.DEBUG);
  }
}
