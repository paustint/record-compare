import { Injectable } from '@angular/core';
import { SelectItem } from 'primeng/api';
import * as _ from 'lodash';

@Injectable()
export class CompareSettingsKeyService {
  private _selectedKeys: string[] = [];
  set selectedKeys(selectedKeys: string[]) {
    this._selectedKeys = selectedKeys.map(key => key);
  }
  get selectedKeys() {
    return this._selectedKeys.map(key => key);
  }

  // Support more in future
  maxKeys = 1;

  constructor() {}

  mapHeadersToSelectedItem(leftHeaders: string[], rightHeaders: string[]): SelectItem[] {
    return _.intersection(leftHeaders || [], rightHeaders || []).map(header => ({
      label: header,
      value: header,
    }));
  }

  setDisabledItems(headers: SelectItem[], selectedHeaders: string[]) {
    if (selectedHeaders.length >= this.maxKeys) {
      headers.forEach(header => {
        // disable all unselected items
        header.disabled = selectedHeaders.includes(header.value) ? false : true;
      });
    } else {
      // enable all items
      headers.forEach(header => (header.disabled = false));
    }
  }
}
