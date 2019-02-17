import { Injectable } from '@angular/core';

// If you import a module but never use any of the imported values other than as TypeScript types,
// the resulting javascript file will look as if you never imported the module at all.
import { ipcRenderer, webFrame, remote, dialog, IpcMessageEvent } from 'electron';
import * as path from 'path';
import * as childProcess from 'child_process';
import * as fs from 'fs-extra';
import { LogService } from './log.service';
import { IPC_EVENT_NAMES } from '../constants';
import { Subject } from 'rxjs';
import { filter, map } from 'rxjs/operators';
import { WorkerEvent, WorkerEventName, ReadCsvFileChunk } from '../models';
import * as _ from 'lodash';
import { parse, ParseResult } from 'papaparse';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  ipcRenderer: typeof ipcRenderer;
  webFrame: typeof webFrame;
  remote: typeof remote;
  childProcess: typeof childProcess;
  dialog: typeof dialog;
  fs: typeof fs;
  path: typeof path;
  windowIds = {
    renderWindowId: null,
    workerId: null,
  };
  tempPath: string;
  downloadsPath: string;

  private workerEvents = new Subject<WorkerEvent<any>>();
  workerEvents$ = this.workerEvents.asObservable();

  constructor(private log: LogService) {
    // Conditional imports
    if (this.isElectron()) {
      this.ipcRenderer = window.require('electron').ipcRenderer;
      this.webFrame = window.require('electron').webFrame;
      this.remote = window.require('electron').remote;
      this.dialog = remote.dialog;

      this.childProcess = window.require('child_process');
      this.fs = window.require('fs-extra');
      this.path = window.require('path');

      this.initEvents();
    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
  };

  private initEvents() {
    this.windowIds = ipcRenderer.sendSync(IPC_EVENT_NAMES.GET_WINDOW_IDS);
    this.tempPath = ipcRenderer.sendSync(IPC_EVENT_NAMES.GET_PATH, 'temp');
    this.downloadsPath = ipcRenderer.sendSync(IPC_EVENT_NAMES.GET_PATH, 'downloads');
    this.log.debug('windowIds', this.windowIds);
    this.log.debug('tempPath', this.tempPath);
    this.log.debug('downloadsPath', this.downloadsPath);
    this.handleWorkerEvents();
  }

  private handleWorkerEvents() {
    ipcRenderer.on(IPC_EVENT_NAMES.WORKER_RESPONSE_EV, (event: IpcMessageEvent, data: WorkerEvent<any>) => {
      this.log.debug('IPC Event', data);
      this.workerEvents.next(data);
    });
  }

  /**
   * Send event to worker process
   */
  sendEventToWorker<T>(name: WorkerEventName, payload: any, waitForResponse = true): Promise<T> {
    return new Promise((resolve, reject) => {
      ipcRenderer.sendTo(this.windowIds.workerId, IPC_EVENT_NAMES.WORKER_MESSAGE_EV, { name, payload });

      if (waitForResponse) {
        const subscription = this.workerEvents$.pipe(filter(event => event.name === name)).subscribe(
          results => {
            subscription.unsubscribe();
            if (results.error) {
              reject(results.error);
            } else {
              resolve(results.payload);
            }
          },
          err => {
            subscription.unsubscribe();
            this.log.error('Error comparing', err);
            reject(err);
          },
          () => {}
        );
      } else {
        resolve();
      }
    });
  }

  async readFileAsJson<T>(filename: string, bytesStart?: number, bytesEnd?: number): Promise<T> {
    const fileData = await this.fs.readJSON(filename, { encoding: 'utf-8' });
    return fileData;
  }

  async readFileAsCsv(
    filename: string,
    options: {
      readChunk: ReadCsvFileChunk;
      transform?: (value: string, field: string | number) => any;
    }
  ): Promise<ParseResult> {
    const { readChunk, transform } = options;
    if (readChunk) {
      const header = await this.readFileChunk(filename, readChunk.header.start, readChunk.header.end);
      const data = await this.readFileChunk(filename, readChunk.data.start, readChunk.data.end);
      const csvStr = `${header}${data}`.trim();
      const csv = parse(csvStr, {
        header: true,
        transform,
      });
      this.log.debug('csv', csv);
      return csv;
    } else {
      const csvStr = await this.fs.readFile(filename, { encoding: 'utf-8' });
      const csv = parse(csvStr, { header: true, transform });
      this.log.debug('csv', csv);
      return csv;
    }
  }

  private readFileChunk(filename: string, bytesStart: number, bytesEnd?: number): Promise<string> {
    return new Promise(async (resolve, reject) => {
      let fileData = '';
      this.fs
        .createReadStream(filename, {
          encoding: 'utf-8',
          start: bytesStart,
          end: bytesEnd,
        })
        .on('data', chunk => {
          fileData += chunk;
        })
        .on('end', () => {
          resolve(fileData);
        })
        .on('error', err => {
          reject(err);
        });
    });
  }
}
