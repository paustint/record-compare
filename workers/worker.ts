import { CompareTableOptions } from '../src/app/models';
import { ipcRenderer, IpcMessageEvent } from 'electron';
import * as comparison from './comparison/worker-comparison';
import { WorkerConfig, WorkerEvent, WorkerEventName, FileContentsEvent } from './worker-models';
const BinaryServer = window.require('binaryjs').BinaryServer;
import * as fs from 'fs-extra';
import * as moment from 'moment';
import { join } from 'path';

const WORKER_MESSAGE_EV = 'WORKER_MESSAGE';
const WORKER_RESPONSE_EV = 'WORKER_RESPONSE';
const GET_WINDOW_IDS_EV = 'GET_WINDOW_IDS';
const GET_PATH = 'GET_PATH';

let binaryServer;
let binaryClient;

const config: WorkerConfig = {
  windowIds: ipcRenderer.sendSync(GET_WINDOW_IDS_EV),
  tempPath: ipcRenderer.sendSync(GET_PATH, 'temp'),
  eventMap: {
    TEST: testEvent,
    COMPARE_TABLE: compareTableData,
  },
};

console.log('Worker Init', config.windowIds);

ipcRenderer.on(WORKER_MESSAGE_EV, handlerWorkerMessage);

startBinaryServer();

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

function testEvent(name: WorkerEventName, payload: any) {
  sendRendererMessage({
    name,
    payload,
  });
}

async function compareTableData(
  name: WorkerEventName,
  payload: { left: FileContentsEvent; right: FileContentsEvent; options: CompareTableOptions },
  useWsStream: boolean = false
) {
  const { left, right, options } = payload;
  // TODO: Read and parse file here instead of having to pass here and back
  const matchRowsOutput = await comparison.parseAndCompare(left, right, options);
  if (useWsStream) {
    const stream = binaryClient.send(
      JSON.stringify({
        name,
        payload: matchRowsOutput,
      })
    );
    stream.end();
  } else {
    sendRendererMessage({
      name,
      payload: matchRowsOutput,
    });
  }
}

function startBinaryServer() {
  console.log('starting binary server');
  fs.ensureDirSync(join(config.tempPath, 'record-compare'));
  // binaryServer = BinaryServer({ port: 9000, chunkSize: 9999999999 });
  binaryServer = BinaryServer({ port: 9000 });

  binaryServer.on('connection', client => {
    const start = process.hrtime();
    console.log('binaryServer:connection');
    binaryClient = client;

    client.on('error', error => {
      console.log('binaryServer:error\n' + error);
    });
    client.on('drain', () => {
      console.log('binaryServer:drain');
    });
    client.on('close', (code, message) => {
      console.log('binaryServer:close\n' + code + '\n' + message);
    });
    client.on('stream', stream => {
      console.log('client:stream');
      let parts = '';
      let results: WorkerEvent;
      stream.on('data', data => {
        console.log('client:stream:data');
        parts += data;
      });
      stream.on('end', () => {
        console.log('client:stream:end');
        results = JSON.parse(parts);
        console.log('results', results);
        try {
          // Submit action
          config.eventMap[results.name](results.name, results.payload, true);
        } catch (ex) {
          console.log('Exception', ex);
        }
      });
    });
  });

  binaryServer.on('error', error => {
    console.log('binaryServer:error\n' + error);
  });
  binaryServer.on('drain', () => {
    console.log('binaryServer:drain');
  });
  binaryServer.on('close', (code, message) => {
    console.log('binaryServer:close\n' + code + '\n' + message);
  });
  binaryServer.on('stream', data => {
    console.log('binaryServer:stream\n' + data);
  });
}
