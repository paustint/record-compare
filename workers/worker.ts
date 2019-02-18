// tslint:disable:no-console
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
// 1000 (convert to sec) * (60 sec in min) * (60 min in hour) * 24 (hours in day) * PURGE_OLD_DIR_AFTER_DAYS (days ago)
const PURGE_OLD_DIR_AFTER_DAYS = 5;
const SEVEN_DAYS_AGO_MS = 1000 * 60 * 60 * 24 * PURGE_OLD_DIR_AFTER_DAYS;

const config: WorkerConfig = {
  windowIds: ipcRenderer.sendSync(GET_WINDOW_IDS_EV),
  tempPath: join(ipcRenderer.sendSync(GET_PATH, 'temp'), 'record-compare'),
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
  const filename = join(config.tempPath, folderName);
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
      return join(config.tempPath, folder, name);
    }
  } else {
    return join(config.tempPath, name);
  }
}

async function cleanTempFolder() {
  console.time('cleanTempFolder');
  const tempFolder = config.tempPath;
  const deletedFolders: string[] = [];
  console.log('Deleting old temp folders', tempFolder);
  try {
    const tempDirContents = (await fs.readdir(tempFolder)).filter(dirName => !dirName.startsWith('.'));
    // tslint:disable-next-line:prefer-const
    for (let dirName of tempDirContents) {
      const dir = `${tempFolder}/${dirName}`;
      try {
        const dirStat = await fs.stat(dir);
        if (dirStat.isDirectory()) {
          const now = new Date().getTime();
          const endTime = new Date(dirStat.birthtime).getTime() + SEVEN_DAYS_AGO_MS;
          if (now > endTime) {
            console.log('Deleting temp folder:', dir);
            await fs.remove(dir);
            deletedFolders.push(dir);
          }
        }
      } catch (ex) {
        console.warn('Error deleting folder', dir, ex);
      }
    }
    console.log('Number of folders deleted', deletedFolders.length);
  } catch (ex) {
    console.warn('Error clearning up old directories', ex);
  }
  console.timeEnd('cleanTempFolder');
}

/**
 * EVENT DELEGATION METHODS
 */

async function compareTableData(
  name: WorkerEventName,
  payload: { left: FileContentsEvent; right: FileContentsEvent; options: CompareTableOptions }
) {
  const { left, right, options } = payload;
  try {
    const matchRowsOutput = await comparison.parseAndCompare(left, right, options);
    sendRendererMessage({
      name,
      payload: matchRowsOutput,
    });
  } catch (ex) {
    console.log('Exception', ex);
    sendRendererMessage({
      name,
      payload: {},
      error: {
        name: ex.name,
        message: ex.message,
      },
    });
  }
}

async function exportComparison(name: WorkerEventName, payload: { inputFilename: string; outputFilename: string }) {
  try {
    const exportComparisonTable = new ExportComparisonTableToXlsx(payload.inputFilename, payload.outputFilename);
    await exportComparisonTable.generateExport();
    sendRendererMessage({
      name,
      payload: {},
    });
  } catch (ex) {
    console.log('Exception', ex);
    sendRendererMessage({
      name,
      payload: {},
      error: {
        name: ex.name,
        message: ex.message,
      },
    });
  }
}

cleanTempFolder();
