"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var electron_context_menu_1 = require("electron-context-menu");
var path = require("path");
var url = require("url");
var iconPath = path.join(__dirname, '../resources/icons/png/64x64.png');
var args = process.argv.slice(1);
var serve = args.some(function (val) { return val === '--serve'; });
function createMainWindow(windows) {
    var electronScreen = electron_1.screen;
    var size = electronScreen.getPrimaryDisplay().workAreaSize;
    // Create the browser window.
    windows.main = new electron_1.BrowserWindow({
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
    }
    else {
        windows.main.loadURL(url.format({
            pathname: path.join(__dirname, '../dist/index.html'),
            protocol: 'file:',
            slashes: true,
        }));
    }
    if (!electron_1.app.isPackaged) {
        windows.main.webContents.openDevTools();
    }
    if (!windows.worker) {
        windows.worker = createWorkerWindow();
    }
    // Emitted when the window is closed.
    windows.main.on('closed', function () {
        // Dereference the window object, usually you would store window
        // in an array if your app supports multi windows, this is the time
        // when you should delete the corresponding element.
        windows.main = null;
    });
    return windows;
}
exports.createMainWindow = createMainWindow;
function createWorkerWindow() {
    console.log('createWorker()');
    var workerWindow = new electron_1.BrowserWindow({
        show: !electron_1.app.isPackaged,
        webPreferences: {
            nodeIntegration: true,
        },
    });
    workerWindow.loadURL(url.format({
        pathname: path.join(__dirname, '../workers/worker.html'),
        protocol: 'file:',
        slashes: true,
    }));
    if (!electron_1.app.isPackaged) {
        workerWindow.webContents.openDevTools();
    }
    return workerWindow;
}
exports.createWorkerWindow = createWorkerWindow;
function setupContextMenu(window) {
    electron_context_menu_1.default({
        window: window,
        showCopyImageAddress: false,
        showSaveImageAs: false,
    });
}
exports.setupContextMenu = setupContextMenu;
//# sourceMappingURL=window-manager.js.map