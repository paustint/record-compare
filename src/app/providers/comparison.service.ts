import { Injectable } from '@angular/core';
// import { requireTaskPool } from 'electron-remote';
import { MatchRows } from '../models';
import { compareTableDate } from '../utils/comparison.util';

@Injectable({
  providedIn: 'root',
})
export class ComparisonService {
  constructor() {}

  async compareTableData(keyField: string, fieldsToCompare: string[], left: any[], right: any[]) {
    // const x = requireTaskPool(require.resolve('../../../workers/compare-text.ts'));
    const results: MatchRows = await compareTableDate(keyField, fieldsToCompare, left, right);
    console.log('results', results);
    return results;
  }
}
