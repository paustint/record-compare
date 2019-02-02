// tslint:disable:no-console
import * as XLSX from 'xlsx';
import { parse } from 'papaparse';
import * as fs from 'fs-extra';
import { FileType, FileContentsResponse, FileContentsEvent, FileContentsTable } from '../worker-models';
import * as DiffMatchPatch from 'diff-match-patch';
import * as _ from 'lodash';
import { CompareTableOptions, MatchRows, MatchRowsWithData, ColMetadata, MatchType, KeyMap } from '../../src/app/models';
import { CHAR_TO_PIXEL_RATIO } from '../../src/app/constants';

const FILETYPE_REGEX = {
  CSV: /\.csv$/i,
  XLSX: /\.(xls|xlsx)$/i,
};

export async function parseAndCompare(
  leftFileData: FileContentsEvent,
  rightFileData: FileContentsEvent,
  options: CompareTableOptions
): Promise<MatchRows> {
  try {
    console.time('parse both files');
    const left = (await parseFile(leftFileData)) as FileContentsTable;
    const right = (await parseFile(rightFileData)) as FileContentsTable;
    console.timeEnd('parse both files');
    try {
      console.time('compare table data');
      const results = compareTableData(left.data, right.data, options);
      console.timeEnd('compare table data');

      return {
        diffMetadata: results.diffMetadata,
        matchedRows: results.matchedRows,
        duplicateLeftKeys: results.duplicateLeftKeys,
        duplicateRightKeys: results.duplicateRightKeys,
        leftIndexToKeyMap: results.leftIndexToKeyMap,
        rightIndexToKeyMap: results.rightIndexToKeyMap,
        rowsWithNoKey: results.rowsWithNoKey,
        colMetadata: results.colMetadata,
      };
    } catch (ex) {
      console.log('Error comparing files', ex);
      throw new Error('Error comparing files');
    }
  } catch (ex) {
    console.log('Error parsing files', ex);
    throw new Error('Error parsing files');
  }
}

export async function parseFile(fileData: FileContentsEvent): Promise<FileContentsResponse> {
  try {
    const { type, filename } = fileData;
    let fileContents: string | Buffer;

    console.time('read file');
    if (type === 'csv') {
      fileContents = await fs.readFile(filename, 'utf-8');
    } else if (type === 'xlsx') {
      fileContents = await fs.readFile(filename);
    } else {
      fileContents = await fs.readFile(filename, 'utf-8');
    }
    console.timeEnd('read file');

    if (type === 'csv') {
      // CSV
      console.time('parse csv');
      const parseResults = parse(fileContents as string, { skipEmptyLines: true, header: true });
      console.timeEnd('parse csv');

      if (parseResults.errors.length > 0) {
        console.log('Errors parsing file', parseResults.errors);
      } else {
        console.log(parseResults.data);
        return {
          type: 'csv',
          headers: parseResults.meta.fields,
          data: parseResults.data,
        };
      }
    } else if (type === 'xlsx') {
      // XLSX
      console.time('parse xlsx');
      const workbook = XLSX.read(fileContents, { type: 'buffer' });
      console.timeEnd('parse xlsx');

      console.time('convert xlsx to json');
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      const data = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: true });
      const headers = Object.keys(data[0]);
      console.timeEnd('convert xlsx to json');

      return {
        type: 'xlsx',
        headers,
        data,
      };
    } else {
      // TEXT
      return {
        type: 'text',
        data: fileContents as string,
      };
    }
  } catch (ex) {
    console.log('Error reading file', ex);
  }
}

/**
 * For a given tabular data
 * @param keyField
 * @param fieldsToCompare
 * @param left
 * @param right
 */
export function compareTableData(left: any[], right: any[], options: CompareTableOptions): MatchRows {
  console.log('compareTableData()');
  // tslint:disable-next-line:prefer-const
  let { keyFields, keyIgnoreCase, fieldsToCompare } = options;
  const matchedRows = matchRows(keyFields, left, right, keyIgnoreCase);
  // Initialize max col length
  matchedRows.colMetadata = fieldsToCompare.reduce((fieldMap: ColMetadata, field) => {
    fieldMap[field] = {
      length: field.length,
      pixels: 0,
      hasDiffs: false, // updated later if diffs exist
    };
    return fieldMap;
  }, {});

  console.log('matchedRows', matchedRows);
  Object.keys(matchedRows.matchedRows).forEach(key => {
    const item = matchedRows.matchedRows[key];
    // Initialize max col length based on header length, then it may grow based on what data exists

    if (item.left && item.right) {
      // item.left and item.right both exist - run comparison
      fieldsToCompare.forEach(cellKey => {
        const diffEngine = new DiffMatchPatch.diff_match_patch();

        const diffs = diffEngine.diff_main(getValAsString(item.left[cellKey]), getValAsString(item.right[cellKey]));
        // diffEngine.diff_cleanupSemantic(diffs);
        item.comparison[cellKey] = {
          diffs,
          maxLength: getMaxStringLength(item.left[cellKey], item.right[cellKey]),
          content: {},
        };
        item.comparison[cellKey].content = getDiffContent(item.comparison[cellKey].diffs);
        // Keep track of the max length across all cell values
        item.hasDiffs = item.hasDiffs || item.comparison[cellKey].content.hasDiff;
        matchedRows.colMetadata[cellKey].length = Math.max(matchedRows.colMetadata[cellKey].length, item.comparison[cellKey].maxLength);
        matchedRows.colMetadata[cellKey].hasDiffs = matchedRows.colMetadata[cellKey].hasDiffs || item.hasDiffs;

        // update diff metadata
        const diffCount = diffs
          .filter(diff => diff[0] !== 0)
          .map(diff => diff[1])
          .join('').length;
        matchedRows.diffMetadata.diffCount += diffCount;
        if (diffCount > 0) {
          matchedRows.diffMetadata.cellDiffCount += 1;
          matchedRows.diffMetadata.colsWithDiff.add(cellKey);
        }
      });
    } else if (item.left) {
      // item.left exists, but item.right does not exist
      fieldsToCompare.forEach(cellKey => {
        item.comparison[cellKey] = {
          diffs: [[-1, item.left[cellKey]]],
          maxLength: getMaxStringLength(item.left[cellKey], ''),
          content: {},
        };
        item.comparison[cellKey].content = getDiffContent(item.comparison[cellKey].diffs);
        // Keep track of the max length across all cell values
        matchedRows.colMetadata[cellKey].length = Math.max(matchedRows.colMetadata[cellKey].length, item.comparison[cellKey].maxLength);
        matchedRows.colMetadata[cellKey].hasDiffs = true;
        matchedRows.diffMetadata.colsWithDiff.add(cellKey);
        matchedRows.diffMetadata.diffCount += item.left[cellKey].length;
        matchedRows.diffMetadata.cellDiffCount += 1;
      });
    } else {
      // item.right exists, but item.left does not exist
      Object.keys(item.right).forEach(cellKey => {
        item.comparison[cellKey] = {
          diffs: [[1, item.right[cellKey]]],
          maxLength: getMaxStringLength('', item.right[cellKey]),
          content: {},
        };
        item.comparison[cellKey].content = getDiffContent(item.comparison[cellKey].diffs);
        // Keep track of the max length across all cell values
        matchedRows.colMetadata[cellKey].length = Math.max(matchedRows.colMetadata[cellKey].length, item.comparison[cellKey].maxLength);
        matchedRows.colMetadata[cellKey].hasDiffs = true;
        matchedRows.diffMetadata.colsWithDiff.add(cellKey);
        matchedRows.diffMetadata.diffCount += item.right[cellKey].length;
        matchedRows.diffMetadata.cellDiffCount += 1;
      });
    }

    if (item.hasDiffs) {
      matchedRows.diffMetadata.rowDiffCount++;
      matchedRows.diffMetadata.rowsWithDiff.push(key);
    }
  });

  // Convert length to pixels
  Object.values(matchedRows.colMetadata).forEach(val => (val.pixels = val.length * CHAR_TO_PIXEL_RATIO));
  matchedRows.diffMetadata.colDiffCount = matchedRows.diffMetadata.colsWithDiff.size;

  return matchedRows;
}

function getValAsString(val: any): string {
  if (_.isString(val)) {
    return val;
  } else if (_.isNil(val) || _.isNaN(val)) {
    return '';
  } else if (_.isNumber(val)) {
    return val.toString();
  } else if (_.isBoolean(val)) {
    return val ? 'TRUE' : 'FALSE';
  } else {
    return JSON.stringify(val);
  }
}

function getDiffContent(diffs: [number, string][]) {
  const output = {
    left: '',
    right: '',
    hasDiff: false,
  };
  diffs.forEach(diff => {
    switch (diff[0]) {
      case -1:
        output.left += getMisMatchSpan(diff[1], 'remove');
        output.hasDiff = true;
        break;
      case 1:
        output.right += getMisMatchSpan(diff[1], 'add');
        output.hasDiff = true;
        break;
      default:
        output.left += getMatchSpan(diff[1]);
        output.right += getMatchSpan(diff[1]);
        break;
    }
  });
  return output;
}

function getMisMatchSpan(val: string, type: MatchType) {
  return `<span class="diff mismatch mismatch-${type}">${val || ''}</span>`;
}
function getMatchSpan(val: string) {
  return `<span class="diff match">${val || ''}</span>`;
}

function getMaxStringLength(item1?: string, item2?: string): number {
  try {
    if (!_.isString(item1) && !_.isString(item2)) {
      return 0;
    } else if (_.isString(item1) && _.isString(item2)) {
      return Math.max(item1.length, item2.length);
    } else if (_.isString(item1)) {
      return item1.length;
    } else {
      return item2.length;
    }
  } catch (ex) {
    return 0;
  }
}

/**
 * Given two arrays with {K => V} data, and a "key", figure out which rows have the same value for the key
 * and associate the rows together
 *
 * @param keyField
 * @param left
 * @param right
 */
function matchRows(keyField: string, left: any[], right: any[], ignoreCase: boolean): MatchRows {
  const matchedRows: MatchRowsWithData = {
    diffMetadata: {
      diffCount: 0,
      rowDiffCount: 0,
      colDiffCount: 0,
      cellDiffCount: 0,
      rowsWithDiff: [],
      colsWithDiff: new Set<String>(),
    },
    left,
    right,
    matchedRows: {},
    duplicateLeftKeys: {},
    duplicateRightKeys: {},
    leftIndexToKeyMap: {},
    rightIndexToKeyMap: {},
    rowsWithNoKey: [],
    colMetadata: {},
  };

  const missingLeftIndexes = new Set<number>();
  const missingRightIndexes = new Set<number>();

  /**
   * Map all rows by the value of the key in each row
   * If the key is not a value it is added to `matchedRows.rowsWithNoKey`
   * If the key is a duplicate from a prior row, it is added to `matchedRows.duplicateLeftKeys`
   */
  const leftKeyMap: KeyMap = left.reduce((rowMap: { [key: string]: any }, row, index) => {
    if (!_.isNil(row[keyField]) && !_.isEmpty(row[keyField])) {
      const exists = (ignoreCase && rowMap[row[keyField].toLowerCase()]) || rowMap[row[keyField]] ? true : false;
      if (exists) {
        matchedRows.duplicateLeftKeys[rowMap[row[keyField]]] = { row, index };
      } else {
        const value = ignoreCase ? row[keyField].toLowerCase() : row[keyField];
        rowMap[value] = { row, index };
      }
    } else {
      missingLeftIndexes.add(index);
    }
    return rowMap;
  }, {});

  /**
   * Map all rows by the value of the key in each row
   * If the key is not a value it is added to `matchedRows.rowsWithNoKey`
   * If the key is a duplicate from a prior row, it is added to `matchedRows.duplicateRightKeys`
   */
  const rightKeyMap: KeyMap = right.reduce((rowMap: { [key: string]: any }, row, index) => {
    if (!_.isNil(row[keyField])) {
      const exists = (ignoreCase && rowMap[row[keyField].toLowerCase()]) || rowMap[row[keyField]] ? true : false;
      if (exists) {
        matchedRows.duplicateRightKeys[rowMap[row[keyField]]] = { row, index };
      } else {
        const value = ignoreCase ? row[keyField].toLowerCase() : row[keyField];
        rowMap[value] = { row, index };
      }
    } else {
      missingRightIndexes.add(index);
    }
    return rowMap;
  }, {});

  const coveredRightKeys = new Set<string>();

  /**
   * Associate the left and right (if exists) rows and their indexes to matched rows
   */
  Object.keys(leftKeyMap).forEach(key => {
    if (!_.isUndefined(rightKeyMap[key])) {
      coveredRightKeys.add(key);
      matchedRows.matchedRows[key] = {
        leftIndex: leftKeyMap[key].index,
        rightIndex: rightKeyMap[key].index,
        left: leftKeyMap[key].row,
        right: rightKeyMap[key].row,
        comparison: {},
        hasDiffs: false, // will be calculated later
      };
    } else {
      matchedRows.matchedRows[key] = {
        leftIndex: leftKeyMap[key].index,
        rightIndex: null,
        left: leftKeyMap[key].row,
        right: null,
        comparison: {},
        hasDiffs: true,
      };
    }
  });

  /**
   * Add any rows from the right that were not already added to matchedRows
   */
  Object.keys(rightKeyMap)
    .filter(key => !coveredRightKeys.has(key))
    .forEach(key => {
      matchedRows.matchedRows[key] = {
        leftIndex: null,
        rightIndex: rightKeyMap[key].index,
        left: null,
        right: rightKeyMap[key].row,
        comparison: {},
        hasDiffs: true,
      };
    });

  /**
   * Add rows that did not have a value in the key field
   */
  missingLeftIndexes.forEach(missingIndex =>
    matchedRows.rowsWithNoKey.push({
      index: missingIndex,
      row: left[missingIndex],
    })
  );

  missingRightIndexes.forEach(missingIndex =>
    matchedRows.rowsWithNoKey.push({
      index: missingIndex,
      row: right[missingIndex],
    })
  );

  return matchedRows;
}
