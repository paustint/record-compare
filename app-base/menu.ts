import { Menu, MenuItemConstructorOptions, shell, app, ipcMain, BrowserWindow } from 'electron';
import openAboutWindow from 'about-window';
import * as path from 'path';

let loggingEnabled = !app.isPackaged;

export function setDefaultApplicationMenu(windows: { main?: BrowserWindow; worker?: BrowserWindow }) {
  const template: MenuItemConstructorOptions[] = [
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'pasteandmatchstyle' },
        { role: 'delete' },
        { role: 'selectall' },
      ],
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forcereload' },
        { role: 'toggledevtools' },
        { type: 'separator' },
        { role: 'resetzoom' },
        { role: 'zoomin' },
        { role: 'zoomout' },
        { type: 'separator' },
        { role: 'togglefullscreen' },
      ],
    },
    {
      role: 'window',
      submenu: [{ role: 'minimize' }, { role: 'close' }],
    },
    {
      role: 'help',
      submenu: [
        {
          label: 'Documentation',
          click() {
            shell.openExternal(`https://github.com/paustint/record-compare`);
          },
        },
        {
          label: 'Search Issues',
          click() {
            shell.openExternal(`https://github.com/paustint/record-compare/issues`);
          },
        },
        { type: 'separator' },
        {
          label: 'Enable Logging',
          checked: loggingEnabled,
          type: 'checkbox',
          visible: !!windows.main,
          click() {
            if (windows.main) {
              loggingEnabled = !loggingEnabled;
              windows.main.webContents.send('TOGGLE_LOGGING', loggingEnabled);
            }
          },
        },
        // TODO: think about this - the issue is the we cannot really close the window (maybe we can intercept user close?)
        // {
        //   label: 'Show Worker Window',
        //   checked: loggingEnabled,
        //   type: 'checkbox',
        //   visible: !!mainwindow,
        //   click() {
        //     loggingEnabled = !loggingEnabled;
        //     mainwindow.webContents.send('TOGGLE_LOGGING', loggingEnabled);
        //   },
        // },
      ],
    },
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: 'Record Compare',
      submenu: [
        {
          role: 'about',
          click: () =>
            openAboutWindow({
              icon_path: path.join(__dirname, '../resources/icons/png/512x512.png'),
              package_json_dir: path.join(__dirname, '..'),
              bug_report_url: 'https://github.com/paustint/record-compare/issues',
              copyright: '2019 Austin Turner',
              product_name: 'Record Compare',
              adjust_window_size: true,
            }),
        },
        { type: 'separator' },
        { role: 'services', submenu: [] },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    });
    template[3].submenu = [{ role: 'close' }, { role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }];
  } else {
    template.unshift({
      label: 'File',
      submenu: [{ role: 'quit' }],
    });
  }

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}
