"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var electron_1 = require("electron");
var about_window_1 = require("about-window");
var path = require("path");
var loggingEnabled = !electron_1.app.isPackaged;
function setDefaultApplicationMenu(windows) {
    var template = [
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
                    click: function () {
                        electron_1.shell.openExternal("https://github.com/paustint/record-compare");
                    },
                },
                {
                    label: 'Search Issues',
                    click: function () {
                        electron_1.shell.openExternal("https://github.com/paustint/record-compare/issues");
                    },
                },
                { type: 'separator' },
                {
                    label: 'Enable Logging',
                    checked: loggingEnabled,
                    type: 'checkbox',
                    visible: !!windows.main,
                    click: function () {
                        if (windows.main) {
                            loggingEnabled = !loggingEnabled;
                            windows.main.webContents.send('TOGGLE_LOGGING', loggingEnabled);
                        }
                    },
                },
            ],
        },
    ];
    if (process.platform === 'darwin') {
        template.unshift({
            label: 'Record Compare',
            submenu: [
                {
                    role: 'about',
                    click: function () {
                        return about_window_1.default({
                            icon_path: path.join(__dirname, '../resources/icons/png/512x512.png'),
                            package_json_dir: path.join(__dirname, '..'),
                            bug_report_url: 'https://github.com/paustint/record-compare/issues',
                            copyright: '2019 Austin Turner',
                            product_name: 'Record Compare',
                            adjust_window_size: true,
                        });
                    },
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
    }
    else {
        template.unshift({
            label: 'File',
            submenu: [{ role: 'quit' }],
        });
    }
    var menu = electron_1.Menu.buildFromTemplate(template);
    electron_1.Menu.setApplicationMenu(menu);
}
exports.setDefaultApplicationMenu = setDefaultApplicationMenu;
//# sourceMappingURL=menu.js.map