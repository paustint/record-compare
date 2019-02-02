import { SafeHtml } from '@angular/platform-browser';

export type WorkerEventName = 'TEST' | 'COMPARE_TABLE';

export interface WorkerEvent<T> {
  name: WorkerEventName;
  payload: T;
}

export interface WorkerEventCompare {
  filename: string;
}

export type LeftRight = 'left' | 'right';
export type CompareType = 'text' | 'table';
export type FileType = 'csv' | 'xlsx' | 'text';
export type MatchType = 'add' | 'remove';
export type OtherCompareTypes = 'adkeyIgnoreCased' | 'compareIgnoreCase';

export interface CompareSettings {
  keys: string[];
  mapping: {
    [source: string]: string;
  };
  keyIgnoreCase: boolean;
  compareIgnoreCase: boolean;
}

export interface CompareTableOptions {
  keyFields: string; // TODO: allow array
  keyIgnoreCase?: boolean;
  compareIgnoreCase?: boolean;
  fieldsToCompare: string[]; // FIXME: wil be replaced with mapping
  mapping?: {
    [source: string]: string;
  };
}

export interface CompareButton {
  name: CompareType;
  label: string;
  class?: string;
  disabled: boolean;
  icon?: string;
  iconPos?: string;
  action: Function;
}

export interface FileStat {
  size: number;
  created: Date;
  modified: Date;
}

export type FileContentsEvent = FileContentsEventCsv | FileContentsEventXlsx | FileContentsEventText;

export interface FileContentsEventBase {
  type: 'csv' | 'xlsx' | 'text';
  filename: string;
  fileStat: FileStat;
}
export interface FileContentsEventCsv extends FileContentsEventBase {
  type: 'csv';
  headers: string[];
}

export interface FileContentsEventXlsx extends FileContentsEventBase {
  type: 'xlsx';
  headers: string[];
}

export interface FileContentsEventText extends FileContentsEventBase {
  type: 'text';
}

export interface RowAndIndex {
  index: number;
  row: number;
}

export interface KeyMap {
  [key: string]: RowAndIndex;
}

export interface ColMetadata {
  [key: string]: ColMetadataItem;
}

export interface ColMetadataItem {
  length: number;
  pixels: number;
  hasDiffs: boolean;
}

export interface DiffMetadata {
  diffCount: number;
  rowDiffCount: number;
  colDiffCount: number;
  cellDiffCount: number;
  rowsWithDiff: string[]; // tricky to get because there are two datasheets - we could store row num or key or some obj with deets
  colsWithDiff: Set<String>;
}

export interface LeftRightData {
  left: any[];
  right: any[];
}

export interface MatchRows {
  diffMetadata: DiffMetadata;
  matchedRows: {
    [key: string]: MatchRowsItem;
  };
  duplicateLeftKeys: {
    [key: string]: RowAndIndex;
  };
  duplicateRightKeys: {
    [key: string]: RowAndIndex;
  };
  leftIndexToKeyMap: {
    [key: number]: string;
  };
  rightIndexToKeyMap: {
    [key: number]: string;
  };
  // FIXME: we don't know if the rows are left or right!
  rowsWithNoKey: Array<RowAndIndex>;
  /** Used to know how wide to set a given column */
  colMetadata: ColMetadata;
}

export type MatchRowsWithData = MatchRows & LeftRightData;

export interface MatchRowsLeftItem {
  leftIndex?: number;
  left?: any;
}

export interface MatchRowsRightItem {
  rightIndex?: number;
  right?: any;
}

export interface MatchRowsItem extends MatchRowsLeftItem, MatchRowsRightItem {
  /** True if any column has a mismatch of any kind */
  hasDiffs: boolean;
  /** Comparisons in a map by field name */
  comparison: {
    [key: string]: {
      diffs: [number, string][];
      maxLength: number;
      content: {
        left?: string | SafeHtml;
        right?: string | SafeHtml;
        hasDiff?: boolean;
      };
    };
  };
}
