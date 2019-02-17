// tslint:disable:no-console
import * as fs from 'fs-extra';
import { FileContentsEvent, FileContentsTable } from '../worker-models';
import * as DiffMatchPatch from 'diff-match-patch';
import * as _ from 'lodash';
import {
  CompareTableOptions,
  MatchRows,
  MatchRowsWithData,
  ColMetadata,
  KeyMap,
  MatchRowsOutput,
  RowBytes,
  ComparisonRow,
  MatchRowsItem,
} from '../../src/app/models';
import { CHAR_TO_PIXEL_RATIO } from '../../src/app/constants';
import { getTempFilename, getTempFolderName } from '../worker';
import { parseFile, writeContentToCsv, getDiffContent, getMaxStringLength, getValAsString } from '../worker-utils';
import { CsvParseError } from '../worker-errors';

/**
 * Give two tabular files (csv/xlsx), compare files
 * Files will be saved to a temporary directory and limited data will be returned
 * @param leftFileData
 * @param rightFileData
 * @param options
 */
export async function parseAndCompare(
  leftFileData: FileContentsEvent,
  rightFileData: FileContentsEvent,
  options: CompareTableOptions
): Promise<MatchRowsOutput> {
  let left: FileContentsTable;
  let right: FileContentsTable;
  try {
    console.time('parse both files');
    left = (await parseFile(leftFileData)) as FileContentsTable;
    right = (await parseFile(rightFileData)) as FileContentsTable;
    console.timeEnd('parse both files');
  } catch (ex) {
    console.log('Error parsing left file', ex);
    throw new CsvParseError(`${left ? 'Right' : 'Left'} File Parsing Error`, ex.message);
  }

  // Both files successfully parsed
  try {
    console.time('compare table data');
    const bytesPerRow = [];
    const results = compareTableData(left.data, right.data, options, bytesPerRow);
    console.timeEnd('compare table data');

    await fs.writeJSON(results.files.bytesPerRow, bytesPerRow);

    const output: MatchRowsOutput = {
      diffMetadata: results.diffMetadata,
      colMetadata: results.colMetadata,
      mapping: options.mapping,
      files: results.files,
    };
    console.log('output', output);
    return output;
  } catch (ex) {
    console.log('Error comparing files', ex);
    throw new Error('Error comparing files');
  }
}

/**
 * For a given tabular data
 * @param keyField
 * @param fieldsToCompare
 * @param left
 * @param right
 */
function compareTableData(left: any[], right: any[], options: CompareTableOptions, bytesPerRow: RowBytes[]): MatchRows {
  console.log('compareTableData()');

  // tslint:disable-next-line:prefer-const
  let { keyFields, keyIgnoreCase, mapping } = options;
  const fieldsToCompare = Object.keys(mapping);
  const matchedRows = matchRows(keyFields, left, right, keyIgnoreCase);

  const csvFields = ['hasDiffs', 'key', 'leftIndex', 'rightIndex', 'left', 'right'];
  const comparisonStream = fs.createWriteStream(matchedRows.files.comparison);
  const headerBytes = writeContentToCsv(csvFields, csvFields, comparisonStream, true);
  bytesPerRow.push({
    hasDiffs: false,
    isHeader: true,
    bytes: headerBytes,
    start: 0,
    end: headerBytes - 1,
  });

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
    const item: MatchRowsItem = matchedRows.matchedRows[key];
    // Initialize max col length based on header length, then it may grow based on what data exists

    const csvRow: ComparisonRow = {
      hasDiffs: false,
      key,
      leftIndex: item.left ? item.leftIndex + 1 : null,
      rightIndex: item.right ? item.rightIndex + 1 : null,
      left: {},
      right: {},
    };

    if (item.left && item.right) {
      // item.left and item.right both exist - run comparison
      fieldsToCompare.forEach(leftKey => {
        const rightKey = mapping[leftKey];
        const diffEngine = new DiffMatchPatch.diff_match_patch();

        const diffs = diffEngine.diff_main(getValAsString(item.left[leftKey]), getValAsString(item.right[rightKey]));
        // diffEngine.diff_cleanupSemantic(diffs);
        item.comparison[leftKey] = {
          diffs,
          maxLength: getMaxStringLength(item.left[leftKey], item.right[rightKey]),
        };
        const diffContent = getDiffContent(item.comparison[leftKey].diffs);
        // prepare CSV Row
        csvRow.left[leftKey] = { content: diffContent.left, hasDiff: diffContent.hasDiff };
        csvRow.right[rightKey] = { content: diffContent.right, hasDiff: diffContent.hasDiff };
        csvRow.hasDiffs = csvRow.hasDiffs || diffContent.hasDiff;

        // Keep track of the max length across all cell values
        item.hasDiffs = item.hasDiffs || diffContent.hasDiff;
        matchedRows.colMetadata[leftKey].length = Math.max(matchedRows.colMetadata[leftKey].length, item.comparison[leftKey].maxLength);
        matchedRows.colMetadata[leftKey].hasDiffs = matchedRows.colMetadata[leftKey].hasDiffs || item.hasDiffs;

        // update diff metadata
        const diffCount = diffs
          .filter(diff => diff[0] !== 0)
          .map(diff => diff[1])
          .join('').length;
        matchedRows.diffMetadata.diffCount += diffCount;
        if (diffCount > 0) {
          matchedRows.diffMetadata.cellDiffCount += 1;
          (matchedRows.diffMetadata.colsWithDiff as Set<string>).add(leftKey);
        }
      });
    } else if (item.left) {
      // item.left exists, but item.right does not exist
      fieldsToCompare.forEach(leftKey => {
        item.comparison[leftKey] = {
          diffs: [[-1, item.left[leftKey]]],
          maxLength: getMaxStringLength(item.left[leftKey], ''),
        };
        const diffContent = getDiffContent(item.comparison[leftKey].diffs);

        // prepare CSV Row
        csvRow.left[leftKey] = { content: diffContent.left, hasDiff: true };
        csvRow.hasDiffs = csvRow.hasDiffs || diffContent.hasDiff;

        // Keep track of the max length across all cell values
        matchedRows.colMetadata[leftKey].length = Math.max(matchedRows.colMetadata[leftKey].length, item.comparison[leftKey].maxLength);
        matchedRows.colMetadata[leftKey].hasDiffs = true;
        (matchedRows.diffMetadata.colsWithDiff as Set<string>).add(leftKey);
        matchedRows.diffMetadata.diffCount += item.left[leftKey].length;
        matchedRows.diffMetadata.cellDiffCount += 1;
      });
    } else {
      // item.right exists, but item.left does not exist
      Object.keys(item.right).forEach(rightKey => {
        item.comparison[rightKey] = {
          diffs: [[1, item.right[rightKey]]],
          maxLength: getMaxStringLength('', item.right[rightKey]),
        };

        const diffContent = getDiffContent(item.comparison[rightKey].diffs);

        // prepare CSV Row
        csvRow.right[rightKey] = { content: diffContent.right, hasDiff: true };
        csvRow.hasDiffs = csvRow.hasDiffs || diffContent.hasDiff;

        // Keep track of the max length across all cell values
        matchedRows.colMetadata[rightKey].length = Math.max(matchedRows.colMetadata[rightKey].length, item.comparison[rightKey].maxLength);
        matchedRows.colMetadata[rightKey].hasDiffs = true;
        (matchedRows.diffMetadata.colsWithDiff as Set<string>).add(rightKey);
        matchedRows.diffMetadata.diffCount += item.right[rightKey].length;
        matchedRows.diffMetadata.cellDiffCount += 1;
      });
    }

    if (item.hasDiffs) {
      matchedRows.diffMetadata.rowDiffCount++;
      matchedRows.diffMetadata.rowsWithDiff.push(key);
    }

    const bytes = writeContentToCsv(
      { ...csvRow, left: JSON.stringify(csvRow.left), right: JSON.stringify(csvRow.right) },
      csvFields,
      comparisonStream,
      true
    );

    if (bytesPerRow.length === 0) {
      bytesPerRow.push({
        hasDiffs: item.hasDiffs,
        isHeader: false,
        bytes,
        start: 0,
        end: bytes,
      });
    } else {
      const prevEntry = bytesPerRow[bytesPerRow.length - 1];
      bytesPerRow.push({
        hasDiffs: item.hasDiffs,
        isHeader: false,
        bytes,
        start: prevEntry.end + 1,
        end: prevEntry.end + bytes,
      });
    }

    // remove item to clear up memory
    matchedRows.matchedRows[key] = undefined;
  });

  // Convert length to pixels
  Object.values(matchedRows.colMetadata).forEach(val => (val.pixels = val.length * CHAR_TO_PIXEL_RATIO));
  // hasDiffs was incorrect for some columns when calculated above
  Object.keys(matchedRows.colMetadata).forEach(key => {
    matchedRows.colMetadata[key].hasDiffs = (matchedRows.diffMetadata.colsWithDiff as Set<string>).has(key);
  });
  matchedRows.diffMetadata.colsWithDiff = Array.from(matchedRows.diffMetadata.colsWithDiff) as string[];
  matchedRows.diffMetadata.colDiffCount = matchedRows.diffMetadata.colsWithDiff.length;

  comparisonStream.end();

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
function matchRows(keyField: string, left: any[], right: any[], ignoreCase: boolean): MatchRows {
  const fileHeaders = {
    duplicateKeys: ['which', 'data'],
    rowsWithNoKeys: ['which', 'index', 'data'],
  };
  const folder = getTempFolderName();
  const matchedRows: MatchRowsWithData = {
    diffMetadata: {
      leftRowCount: left.length,
      rightRowCount: right.length,
      matchedRowsCount: 0,
      leftDuplicateKeyCount: 0,
      rightDuplicateKeyCount: 0,
      leftRowsWithoutKeyCount: 0,
      rightRowsWithoutKeyCount: 0,
      matchedRows: 0,
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
    rowsWithNoKey: [],
    colMetadata: {},
    files: {
      folder,
      comparison: getTempFilename({ folder, filenamePrefix: 'compared-rows', ext: 'csv' }),
      duplicateKeys: getTempFilename({ folder, filenamePrefix: 'duplicate-keys', ext: 'csv' }),
      rowsWithNoKeys: getTempFilename({ folder, filenamePrefix: 'rows-with-no-keys', ext: 'csv' }),
      bytesPerRow: getTempFilename({ folder, filenamePrefix: 'bytes-per-row', ext: 'json' }),
    },
  };

  let duplicateKeysStream: fs.WriteStream | undefined;
  let rowsWithNoKeysStream: fs.WriteStream | undefined;

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
        matchedRows.diffMetadata.leftDuplicateKeyCount++;
        if (!duplicateKeysStream) {
          duplicateKeysStream = fs.createWriteStream(matchedRows.files.duplicateKeys);
          writeContentToCsv(fileHeaders.duplicateKeys, fileHeaders.duplicateKeys, duplicateKeysStream);
        }
        writeContentToCsv({ which: 'left', data: JSON.stringify(row[keyField]) }, fileHeaders.duplicateKeys, duplicateKeysStream);
        // matchedRows.duplicateLeftKeys[row[keyField]] = rowMap[row[keyField]];
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
        matchedRows.diffMetadata.rightDuplicateKeyCount++;
        if (!duplicateKeysStream) {
          duplicateKeysStream = fs.createWriteStream(matchedRows.files.duplicateKeys);
          writeContentToCsv(fileHeaders.duplicateKeys, fileHeaders.duplicateKeys, duplicateKeysStream);
        }
        writeContentToCsv({ which: 'right', data: JSON.stringify(row[keyField]) }, fileHeaders.duplicateKeys, duplicateKeysStream);
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
    matchedRows.diffMetadata.matchedRowsCount++;
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
      matchedRows.diffMetadata.matchedRowsCount++;
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
  missingLeftIndexes.forEach(missingIndex => {
    matchedRows.diffMetadata.leftRowsWithoutKeyCount++;
    if (!rowsWithNoKeysStream) {
      rowsWithNoKeysStream = fs.createWriteStream(matchedRows.files.rowsWithNoKeys);
      writeContentToCsv(fileHeaders.rowsWithNoKeys, fileHeaders.rowsWithNoKeys, duplicateKeysStream);
    }
    writeContentToCsv(
      { which: 'left', index: missingIndex, data: JSON.stringify(left[missingIndex]) },
      fileHeaders.rowsWithNoKeys,
      rowsWithNoKeysStream
    );
  });

  missingRightIndexes.forEach(missingIndex => {
    matchedRows.diffMetadata.rightRowsWithoutKeyCount++;
    if (!rowsWithNoKeysStream) {
      rowsWithNoKeysStream = fs.createWriteStream(matchedRows.files.rowsWithNoKeys);
      writeContentToCsv(fileHeaders.rowsWithNoKeys, fileHeaders.rowsWithNoKeys, duplicateKeysStream);
    }
    writeContentToCsv(
      { which: 'right', index: missingIndex, data: JSON.stringify(right[missingIndex]) },
      fileHeaders.rowsWithNoKeys,
      rowsWithNoKeysStream
    );
  });

  if (duplicateKeysStream) {
    duplicateKeysStream.end();
  } else {
    matchedRows.files.duplicateKeys = null;
  }

  if (rowsWithNoKeysStream) {
    rowsWithNoKeysStream.end();
  } else {
    matchedRows.files.rowsWithNoKeys = null;
  }

  return matchedRows;
}
