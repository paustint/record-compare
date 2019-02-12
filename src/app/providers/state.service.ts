import { Injectable } from '@angular/core';
import { ComponentState } from '../models';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root',
})
export class StateService {
  private state: ComponentState = {
    compareFiles: {},
    compareFilesTable: {},
    compareFilesSettings: {},
    compareText: {},
  };

  constructor(private log: LogService) {}

  clearState(key: keyof ComponentState) {
    this.state[key] = {};
  }

  restoreState(key: keyof ComponentState, component: any): boolean {
    const stateKeys = Object.keys(this.state[key]);
    if (stateKeys.length > 0) {
      stateKeys.forEach(prop => {
        component[prop] = this.state[key][prop];
      });
      this.log.debug('[STATE] restored state', key, component);
      return true;
    } else {
      this.log.debug('[STATE] no state to restore', key);
      return false;
    }
  }

  setState(key: keyof ComponentState, newState: any, clearOldState = false) {
    if (clearOldState) {
      this.state[key] = newState;
    } else {
      this.state[key] = { ...this.state[key], ...newState };
    }
    this.log.debug('[STATE] set state for', key, newState);
  }
}
