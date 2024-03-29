export type WorkerEventName = 'COMPARE_TABLE' | 'EXPORT_COMPARISON';

export type WorkerFn = (name: string, payload: any, useWsStream?: boolean) => void;

export interface WorkerError {
  name: string;
  message: string;
  data?: any;
}

export interface WorkerConfig {
  windowIds: {
    renderWindowId: number | null;
    workerId: number | null;
  };
  tempPath: string;
  eventMap: { [K in WorkerEventName]: WorkerFn };
}

export interface WorkerEvent {
  name: WorkerEventName;
  error?: WorkerError;
  payload: any;
}

export type FileType = 'csv' | 'xlsx' | 'text';

export interface ParseFileResponse {
  type?: FileType;
}

export interface FileStat {
  size: number;
  created: Date;
  modified: Date;
}

export type FileContentsResponse = FileContentsTable | FileContentsText;

export interface FileContentsTable {
  type: 'csv' | 'xlsx';
  data: any[];
  headers: string[];
}

export interface FileContentsText {
  type: 'text';
  data: string;
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
