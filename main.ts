import { app, BrowserWindow, ipcMain, IpcMessageEvent } from 'electron';
import * as url from 'url';
import { createMainWindow, createWorkerWindow } from './app-base/window-manager';
import { setDefaultApplicationMenu } from './app-base/menu';

const windows: { main?: BrowserWindow; worker?: BrowserWindow } = {};

const GET_WINDOW_IDS_EV = 'GET_WINDOW_IDS';
const GET_PATH = 'GET_PATH';

try {
  ipcMain.on(GET_WINDOW_IDS_EV, (event: IpcMessageEvent) => {
    console.log('[IPC EVENT] SYNC', GET_WINDOW_IDS_EV);
    event.returnValue = {
      renderWindowId: windows.main.webContents.id,
      workerId: windows.worker.webContents.id,
    };
  });

  ipcMain.on(GET_PATH, (event: IpcMessageEvent, name: string) => {
    console.log('[IPC EVENT] SYNC', GET_PATH);
    event.returnValue = app.getPath(name);
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', () => {
    createMainWindow(windows);
    setDefaultApplicationMenu(windows);
    if (windows.main) {
      windows.main.webContents.on('crashed', ex => {
        app.relaunch();
        console.log('App crashed', ex);
      });
    }
    if (windows.worker) {
      windows.worker.webContents.on('crashed', ex => {
        windows.worker.close();
        windows.worker = createWorkerWindow();
        console.log('Worker crashed', ex);
      });
    }
  });

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // https://electronjs.org/docs/tutorial/security#12-disable-or-limit-navigation
  app.on('web-contents-created', (webContentsEvent, contents) => {
    contents.on('crashed', err => {});
    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new url.URL(navigationUrl);
      if (parsedUrl.origin !== 'http://localhost') {
        event.preventDefault();
      }
    });
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (!windows.main) {
      createMainWindow(windows);
    }
  });
} catch (ex) {
  // Catch Error
  // throw e;
  console.error('ERROR', ex);
  // TODO: do someting!
}
