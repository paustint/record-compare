export interface RowAndIndex {
  index: number;
  row: number;
}

export interface KeyMap {
  [key: string]: RowAndIndex;
}

export interface MatchRows {
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
  rowsWithNoKey: Array<RowAndIndex>;
}

export interface MatchRowsLeftItem {
  leftIndex?: number;
  left?: any;
}

export interface MatchRowsRightItem {
  rightIndex?: number;
  right?: any;
}

export interface MatchRowsComparison {
  comparison: {
    [key: string]: {
      diffs: [number, string][];
    };
  };
}

export type MatchRowsItem = MatchRowsLeftItem & MatchRowsRightItem & MatchRowsComparison;
