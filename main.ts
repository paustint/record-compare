import { app, BrowserWindow, screen, ipcMain, IpcMessageEvent } from 'electron';
import * as path from 'path';
import * as url from 'url';

let win: BrowserWindow;
let workerWindow: BrowserWindow;
const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');

const GET_WINDOW_IDS_EV = 'GET_WINDOW_IDS';
const GET_PATH = 'GET_PATH';

function createWindow() {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  win = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
  });

  if (serve) {
    require('electron-reload')(__dirname, {
      electron: require(`${__dirname}/node_modules/electron`),
    });
    win.loadURL('http://localhost:4200');
  } else {
    win.loadURL(
      url.format({
        pathname: path.join(__dirname, 'dist/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  win.webContents.openDevTools();

  createWorker();

  // Emitted when the window is closed.
  win.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    win = null;
  });
}

function createWorker() {
  console.log('createWorker()');
  workerWindow = new BrowserWindow({
    // show: false,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  workerWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, 'workers/worker.html'),
      protocol: 'file:',
      slashes: true,
    })
  );

  workerWindow.webContents.openDevTools();
}

try {
  ipcMain.on(GET_WINDOW_IDS_EV, (event: IpcMessageEvent) => {
    console.log('[IPC EVENT] SYNC', GET_WINDOW_IDS_EV);
    event.returnValue = {
      renderWindowId: win.webContents.id,
      workerId: workerWindow.webContents.id,
    };
  });

  ipcMain.on(GET_PATH, (event: IpcMessageEvent, name: string) => {
    console.log('[IPC EVENT] SYNC', GET_PATH);
    event.returnValue = app.getPath(name);
  });

  // This method will be called when Electron has finished
  // initialization and is ready to create browser windows.
  // Some APIs can only be used after this event occurs.
  app.on('ready', createWindow);

  // Quit when all windows are closed.
  app.on('window-all-closed', () => {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  app.on('activate', () => {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (win === null) {
      createWindow();
    }
  });
} catch (ex) {
  // Catch Error
  // throw e;
  console.error('ERROR', ex);
}
