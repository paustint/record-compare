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
import { WorkerEvent, WorkerEventName } from '../models';
const BinaryClient = window.require('binaryjs').BinaryClient;

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
  binaryClient: any;

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

      this.initBinaryClient();
      this.initEvents();
    }
  }

  isElectron = () => {
    return window && window.process && window.process.type;
  };

  private initBinaryClient() {
    setTimeout(() => {
      this.log.debug('initBinaryClient()');
      this.binaryClient = new BinaryClient('ws://localhost:9000');

      this.binaryClient.on('stream', stream => {
        this.log.debug('initBinaryClient stream', stream);
      });

      this.binaryClient.on('close', (code, message) => {
        this.log.debug('initBinaryClient close', code, message);
      });

      this.binaryClient.on('open', () => {
        this.log.debug('initBinaryClient open');
      });

      this.binaryClient.on('error', err => {
        this.log.debug('initBinaryClient error', err);
      });
    }, 1000);
  }

  private initEvents() {
    this.windowIds = ipcRenderer.sendSync(IPC_EVENT_NAMES.GET_WINDOW_IDS);
    this.tempPath = ipcRenderer.sendSync(IPC_EVENT_NAMES.GET_PATH, 'temp');
    this.log.debug('windowIds', this.windowIds);
    this.log.debug('tempPath', this.tempPath);
    this.handleWorkerEvents();
  }

  private handleWorkerEvents() {
    ipcRenderer.on(IPC_EVENT_NAMES.WORKER_RESPONSE_EV, (event: IpcMessageEvent, data: WorkerEvent<any>) => {
      this.log.debug('IPC Event', data);
      this.workerEvents.next(data);
    });
    this.sendEventToWorker('TEST', { foo: 'bar' });
  }

  /**
   * Send event to worker process
   */
  sendEventToWorker(name: WorkerEventName, payload: any) {
    ipcRenderer.sendTo(this.windowIds.workerId, IPC_EVENT_NAMES.WORKER_MESSAGE_EV, { name, payload });
  }
}
