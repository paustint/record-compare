import * as DiffMatchPatch from 'diff-match-patch';
import * as _ from 'lodash';
import { MatchRows, KeyMap } from './models';

/**
 * For a given tabular data
 * @param keyField
 * @param fieldsToCompare
 * @param left
 * @param right
 */
export function compareTableDate(keyField: string, fieldsToCompare: string[], left: any[], right: any[]): MatchRows {
  const matchedRows = matchRows(keyField, left, right);
  console.log('matchedRows', matchedRows);
  Object.keys(matchedRows.matchedRows).forEach(key => {
    const item = matchedRows.matchedRows[key];
    if (item.left && item.right) {
      // item.left and item.right both exist - run comparison
      fieldsToCompare.forEach(cellKey => {
        const diffEngine = new DiffMatchPatch.diff_match_patch();

        const diffs = diffEngine.diff_main(item.left[cellKey], item.right[cellKey]);
        diffEngine.diff_cleanupSemantic(diffs);
        item.comparison[cellKey] = { diffs };
      });
    } else if (item.left) {
      // item.left exists, but item.right does not exist
      fieldsToCompare.forEach(cellKey => {
        item.comparison[cellKey] = { diffs: [[-1, item.left[cellKey]]] };
      });
    } else {
      // item.right exists, but item.left does not exist
      Object.keys(item.right).forEach(cellKey => {
        item.comparison[cellKey] = { diffs: [[1, item.right[cellKey]]] };
      });
    }
  });

  return matchedRows;
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
    matchedRows: {},
    duplicateLeftKeys: {},
    duplicateRightKeys: {},
    leftIndexToKeyMap: {},
    rightIndexToKeyMap: {},
    rowsWithNoKey: [],
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
      };
    } else {
      matchedRows.matchedRows[key] = {
        leftIndex: leftKeyMap[key].index,
        rightIndex: null,
        left: leftKeyMap[key].row,
        right: null,
        comparison: {},
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
        right: rightKeyMap[key].index,
        comparison: {},
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
