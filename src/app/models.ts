import { SafeHtml } from '@angular/platform-browser';

export type LeftRight = 'left' | 'right';
export type CompareType = 'text' | 'table';
export type FileType = 'csv' | 'xlsx' | 'text';
export type MatchType = 'add' | 'remove';

export interface FileStat {
  size: number;
  created: Date;
  modified: Date;
}

export type FileContentsEvent = FileContentsEventCsv | FileContentsEventXlsx | FileContentsEventText;

export interface FileContentsEventCsv {
  type: 'csv';
  raw: string;
  parsed: any[];
  headers: string[];
}

export interface FileContentsEventXlsx {
  type: 'xlsx';
  parsed: any[];
  headers: string[];
}

export interface FileContentsEventText {
  type: 'text';
  raw: string;
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

export interface MatchRows {
  diffMetadata: DiffMetadata;
  left: any[];
  right: any[];
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
