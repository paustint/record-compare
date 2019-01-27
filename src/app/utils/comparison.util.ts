import * as DiffMatchPatch from 'diff-match-patch';
import * as _ from 'lodash';
import { MatchRows, KeyMap, MatchType, ColMetadata } from '../models';
import { CHAR_TO_PIXEL_RATIO } from '../constants';

/**
 * For a given tabular data
 * @param keyField
 * @param fieldsToCompare
 * @param left
 * @param right
 */
export function compareTableDate(keyField: string, fieldsToCompare: string[], left: any[], right: any[]): MatchRows {
  const matchedRows = matchRows(keyField, left, right);
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
function matchRows(keyField: string, left: any[], right: any[]): MatchRows {
  const matchedRows: MatchRows = {
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
      if (rowMap[row[keyField]]) {
        matchedRows.duplicateLeftKeys[keyField] = { row, index };
      } else {
        rowMap[row[keyField]] = { row, index };
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
      if (rowMap[row[keyField]]) {
        matchedRows.duplicateRightKeys[keyField] = { row, index };
      } else {
        rowMap[row[keyField]] = { row, index };
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
