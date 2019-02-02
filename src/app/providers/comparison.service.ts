import { Injectable } from '@angular/core';
// import { requireTaskPool } from 'electron-remote';
import { MatchRows, CompareTableOptions } from '../models';
import { compareTableData } from '../utils/comparison.util';

@Injectable({
  providedIn: 'root',
})
export class ComparisonService {
  constructor() {}

  async compareTableData(left: any[], right: any[], options: CompareTableOptions) {
    // const x = requireTaskPool(require.resolve('../../../workers/compare-text.ts'));
    const results: MatchRows = await compareTableData(left, right, options);
    console.log('results', results);
    return results;
  }
}
