import { SafeHtml } from '@angular/platform-browser';
import { SelectItem } from 'primeng/api';

export interface Pagination {
  total: number;
  totalDiffs: number;
  page: number;
  pageSize: number;
}

export type WorkerEventName = 'COMPARE_TABLE' | 'EXPORT_COMPARISON';

export interface WorkerEvent<T> {
  name: WorkerEventName;
  payload: T;
}

export type LeftRight = 'left' | 'right';
export type CompareType = 'text' | 'table';
export type FileType = 'csv' | 'xlsx' | 'text';
export type MatchType = 'add' | 'remove';
export type OtherCompareTypes = 'adkeyIgnoreCased' | 'compareIgnoreCase';

export interface AppFooterItem {
  isHeadingLabel?: boolean;
  title: string;
  hasValue: boolean;
  value?: string | number | boolean | null | undefined;
  titleClass?: string | string[] | Set<string> | { [klass: string]: any };
  valueClass?: string | string[] | Set<string> | { [klass: string]: any };
}

export interface ReadCsvFileChunk {
  header: { start: number; end: number };
  data: { start: number; end?: number };
}

export interface CompareSettings {
  keys: string[];
  mapping: {
    [source: string]: string;
  };
  mappedHeaders: MappedHeadingItemRow[];
  keyIgnoreCase: boolean;
  compareIgnoreCase: boolean;
}

export interface CompareTableOptions {
  keyFields: string; // TODO: allow array
  keyIgnoreCase?: boolean;
  compareIgnoreCase?: boolean;
  mapping: {
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
  tooltip: (val?: boolean) => string | undefined | null;
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

export interface ComparisonRowItem {
  [key: string]: {
    hasDiff: boolean;
    content: string | SafeHtml;
  };
}

export interface ComparisonRow {
  hasDiffs: boolean;
  key: string;
  leftIndex?: number;
  rightIndex?: number;
  left: ComparisonRowItem;
  right: ComparisonRowItem;
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
  leftRowCount: number;
  rightRowCount: number;
  matchedRowsCount: number;
  leftDuplicateKeyCount: number;
  rightDuplicateKeyCount: number;
  leftRowsWithoutKeyCount: number;
  rightRowsWithoutKeyCount: number;

  diffCount: number;
  rowDiffCount: number;
  colDiffCount: number;
  cellDiffCount: number;
  rowsWithDiff: string[]; // key
  colsWithDiff: Set<String> | string[];
}

export interface LeftRightData {
  left: any[];
  right: any[];
}

export interface RowBytes {
  isHeader?: boolean;
  hasDiffs: boolean;
  bytes: number;
  start: number;
  end?: number;
}

export interface MatchRowFiles {
  folder: string;
  comparison: string | null;
  duplicateKeys: string | null;
  rowsWithNoKeys: string | null;
  bytesPerRow: string | null;
}

export interface MatchRows {
  diffMetadata: DiffMetadata;
  matchedRows: {
    [key: string]: MatchRowsItem;
  };
  // FIXME: we don't know if the rows are left or right!
  rowsWithNoKey: Array<RowAndIndex>;
  /** Used to know how wide to set a given column */
  colMetadata: ColMetadata;
  files: MatchRowFiles;
}

export interface MatchRowsOutput {
  diffMetadata: DiffMetadata;
  colMetadata: ColMetadata;
  files: MatchRowFiles;
  mapping: {
    [source: string]: string;
  };
}

export interface TableHeader {
  label: string;
  origLabel: string; // right column header
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
    };
  };
}

export interface MatchRowsItemContent {
  left: string | SafeHtml;
  right: string | SafeHtml;
  hasDiff: boolean;
}

export interface MappedHeadingItemRow {
  left: string;
  right?: string;
  options: SelectItem[];
  autoMatched: boolean;
  autoMatchedType?: 'default' | 'lowercase' | 'removeSpecial';
}

export interface ComponentState {
  compareFiles: { [classPropertyName: string]: any };
  compareFilesTable: { [classPropertyName: string]: any };
  compareFilesSettings: { [classPropertyName: string]: any };
  compareText: { [classPropertyName: string]: any };
}
