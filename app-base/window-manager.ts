import { app, BrowserWindow, screen } from 'electron';
import contextMenu from 'electron-context-menu';

import * as path from 'path';
import * as url from 'url';

const iconPath = path.join(__dirname, '../resources/icons/png/64x64.png');
const args = process.argv.slice(1);
const serve = args.some(val => val === '--serve');

export function createMainWindow(windows: { main?: BrowserWindow; worker?: BrowserWindow }) {
  const electronScreen = screen;
  const size = electronScreen.getPrimaryDisplay().workAreaSize;

  // Create the browser window.
  windows.main = new BrowserWindow({
    x: 0,
    y: 0,
    width: size.width,
    height: size.height,
    minHeight: 900,
    minWidth: 900,
    webPreferences: {
      nodeIntegration: true,
      textAreasAreResizable: false,
    },
    icon: iconPath,
  });

  setupContextMenu(windows.main);

  if (serve) {
    require('electron-reload')(__dirname, {
      // electron: require(`${__dirname}/node_modules/electron`),
      electron: require(path.join(__dirname, '../node_modules/electron')),
    });
    windows.main.loadURL('http://localhost:4200');
  } else {
    windows.main.loadURL(
      url.format({
        pathname: path.join(__dirname, '../dist/index.html'),
        protocol: 'file:',
        slashes: true,
      })
    );
  }

  if (!app.isPackaged) {
    windows.main.webContents.openDevTools();
  }

  if (!windows.worker) {
    windows.worker = createWorkerWindow();
  }

  // Emitted when the window is closed.
  windows.main.on('closed', () => {
    // Dereference the window object, usually you would store window
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    windows.main = null;
  });
  return windows;
}

export function createWorkerWindow() {
  console.log('createWorker()');
  const workerWindow = new BrowserWindow({
    show: !app.isPackaged,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  workerWindow.loadURL(
    url.format({
      pathname: path.join(__dirname, '../workers/worker.html'),
      protocol: 'file:',
      slashes: true,
    })
  );
  if (!app.isPackaged) {
    workerWindow.webContents.openDevTools();
  }
  return workerWindow;
}

export function setupContextMenu(window: BrowserWindow) {
  contextMenu({
    window,
    showCopyImageAddress: false,
    showSaveImageAs: false,
  });
}
