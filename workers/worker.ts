import { CompareTableOptions } from '../src/app/models';
import { ipcRenderer, IpcMessageEvent } from 'electron';
import * as comparison from './comparison/worker-comparison';
import { WorkerConfig, WorkerEvent, WorkerEventName, FileContentsEvent } from './worker-models';
import * as fs from 'fs-extra';
import * as moment from 'moment';
import { join } from 'path';
import { ExportComparisonTableToXlsx } from './exports/export-to-file';

const WORKER_MESSAGE_EV = 'WORKER_MESSAGE';
const WORKER_RESPONSE_EV = 'WORKER_RESPONSE';
const GET_WINDOW_IDS_EV = 'GET_WINDOW_IDS';
const GET_PATH = 'GET_PATH';

const config: WorkerConfig = {
  windowIds: ipcRenderer.sendSync(GET_WINDOW_IDS_EV),
  tempPath: ipcRenderer.sendSync(GET_PATH, 'temp'),
  eventMap: {
    COMPARE_TABLE: compareTableData,
    EXPORT_COMPARISON: exportComparison,
  },
};

console.log('Worker Init', config.windowIds);

ipcRenderer.on(WORKER_MESSAGE_EV, handlerWorkerMessage);

function handlerWorkerMessage(event: IpcMessageEvent, data: WorkerEvent) {
  config.eventMap[data.name](data.name, data.payload);
}

function sendRendererMessage(event: WorkerEvent) {
  ipcRenderer.sendTo(config.windowIds.renderWindowId, WORKER_RESPONSE_EV, event);
}

export function getTempFolderName(): string {
  const folderName = `compare-${String(moment().valueOf())}`;
  const filename = join(config.tempPath, 'record-compare', folderName);
  console.log('temp foldername:', filename);
  fs.ensureDirSync(filename);
  return filename;
}

export function getTempFilename(options: { folder?: string; filenamePrefix: string; ext: string }): string {
  // tslint:disable-next-line:prefer-const
  let { folder, filenamePrefix, ext } = options;
  ext = ext.startsWith('.') ? ext : `.${ext}`;
  const name = `${filenamePrefix}-${String(moment().valueOf())}${ext}`;
  if (folder) {
    if (folder.startsWith(config.tempPath)) {
      return join(folder, name);
    } else {
      return join(config.tempPath, 'record-compare', folder, name);
    }
  } else {
    return join(config.tempPath, 'record-compare', name);
  }
}

// FIXME: run at load
function cleanTempFolder() {
  // TODO: delete files older than some timeperiod
}

/**
 * EVENT DELEGATION METHODS
 */

async function compareTableData(
  name: WorkerEventName,
  payload: { left: FileContentsEvent; right: FileContentsEvent; options: CompareTableOptions }
) {
  const { left, right, options } = payload;
  // TODO: Read and parse file here instead of having to pass here and back
  const matchRowsOutput = await comparison.parseAndCompare(left, right, options);
  sendRendererMessage({
    name,
    payload: matchRowsOutput,
  });
}

async function exportComparison(name: WorkerEventName, payload: { inputFilename: string; outputFilename: string }) {
  const exportComparisonTable = new ExportComparisonTableToXlsx(payload.inputFilename, payload.outputFilename);
  await exportComparisonTable.generateExport();
  sendRendererMessage({
    name,
    payload: {},
  });
}
