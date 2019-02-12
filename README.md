
# TODO: refactor to match application



## TODO
- BUGS
  - [x] IF a user loads a new file and clicks compare, we do compare but the UI does not update.
    - [ ] We need to figure out the interaction for these
  - [x] Reset settings after file is changed (e.x. mapping and key)
  - [x] Modals may extend beyond page
  - [x] Show better cell level CSS for mismatch (e.x. we only have string now, we might need a {mismatch: true, content: <span></span>})
  - [x] Need to show stats of what was compared
  - [ ] Using filters, dynamically use byteArray to get more rows as needed based on selection (cache will need to have this option as part of key)
  - [ ] Clean up old cache - this grows very quickly
    - [ ] can we use cache to recall results? Allow user to have some settings to control how this works?
  - [x] On page size change, if on last page, then the records shown are not the correct records
  - [ ] IF files are dragged in, then the buttons do not enable
  - [ ] row heights do not line up and cause scrolling to be out of whack
  - [ ] value changed after it was chcked (for some files)
  - [ ] error loading small CSV test file and XLSX (worker throws exception)
  - [ ] Most CSV (or all) have a header changed after it was checked error
  - [x] Performing another comparison does not clear out footer from prior comparison
- MISC
  - [ ] Create types for binaryjs
- APP
  - [x] When matching rows, we will want to keep the order and add in spaces (empty rows) on the left or right based on if there are matches later on (e.x. keep matches next to eachother no matter what, but also retain order)
  - [ ] if there is an error connecting the the binary server, try again (there is a small window where we could be disconnected - happend to me!)
  - [x] Figure out top menu - do we want it or not? we should use native menu instead, but need to see what menu items we want and how to use them
  - [ ] Figure out layout for non-file compare (e.x. tabs? radio buttons? etc..) to change view
    - [ ] For user pasted text, we should have the input (edit mode) and replace it with the compared results
- FILE UPLOAD
  - [x] Allow dragging and dropping a file
    - [ ] BUG: settings buttons do not enable after dragged in file
  - [x] Show loading indicator while parsing a large file
  - [ ] Disable file input while a file is being loaded/parsed
  - [x] Filesize should be in friendly units
  - [ ] If there is an error parsing or reading the file, the user does no know about it.
    - [ ] Ex. make a CSV where data extends beyond the columns
  - [x] Show how many rows or lines in the file exist (depending on type of file)
- [ ] TABLE
  - [ ] FILTERS
    - [ ] Add filters to only show some data (checkboxes)
      - [x] hide matching rows
      - [x] hide matching columns
    - [ ] Add filters to allow user text filters
      - [ ] Allow fuzzy searching (could use https://neil.fraser.name/software/diff_match_patch/demos/match.html)
      - [ ] NOTE: this will be difficult since we are streaming specific parts of the file - might not be worth it (unless we only search when we have in memory)
  - [ ] METRICS / INFORMATION
    - [ ] Show number of mismatches
      - [x] Total
      - [x] Cells
      - [x] Rows
  - [ ] HEADERS
    - [ ] Require that user choose headers
      - [ ] We should auto-match headers in source and target files
      - [ ] User can change them from there
      - [ ] User can save / restore headers (remember prior history for a project automatically)
    - [x] require user to select a key (field to match source and target data)
      - [ ] this should support composite keys (e.x. multiple fields concatenated together to find match)
    - [ ] COLUMNS
      - [ ] Allow the user to sort data
      - [ ] Allow user to hide columns
      - [ ] Allow user to filter on any given column (maybe even allow text input)
    - [ ] NO RESULTS
      - [ ] IF there are no results to compare, then we should tell the user this instead of showing a blank screen
  - [ ] STYLING
    - [ ] Better table styling - let's look hip!
    - [ ] Add padding on cells
    - [ ] possibly add orders to make data more tabular looking
- [ ] COMPARISON
  - [x] Add support for XLSX table comparison
  - [ ] Allow comparing any two text files
  - [ ] Allow user to paste in text to compare (If CSV data, then )
  - [ ] Allow user to compare any content from two web resources (e.x. URL) (as text)
  - [x] Handle duplicate keys and show user results or some error or something (TABLE COMPARE)
    - [ ] Add a popover "help" for why rows are skipped
  - [ ] Allow case-insensitive matching (either for keys or for all data)
- [ ] ERROR HANDLING
  - [ ] Figure out a pattern / UI for handling errors
- [ ] NOTIFICATIONS
  - [ ] For long-running comparisons (if we have them) optionally notify user when done if app does not have focus
- [ ] LOGGING
  - [x] Figure out local logging
  - [ ] Figure out telemetrics (e.x. user action logging - ask user before collecting, if we decide to collect)
  - [ ] Remote error connection (rollbar)
- [ ] PERFORMANCE
  - [x] Have all work happen in a different thread
  - [x] show loading indicators
  - [x] Test very large datasets and create a plan for improving
- [ ] NATIVE SUPPORT (OS)
  - [ ] notifications
  - [ ] open with....
  - [ ] compare files.... (if two selected)
- [ ] EXPORT
  - [ ] Allow user to export data
    - [ ] just different rows
    - [ ] PDF with formatting
      - [ ] honor selected filters or allow options on generation
- [ ] PROJECTS
  - [ ] Allow user to save a project
    - [ ] this should copy data into project folder (either OG or a copy - need to figure out)
- [ ] APPLICATION LIFECYCLE
  - [ ] Remember prior state of application on closed and reload it on application open
  - [ ] Allow the user to clear their workspace
- [ ] STYLING
  - [ ] Figure out a look and feel for the application (make it seem like an app and not a webpage if possible)
  - [ ] Choose a nice background color or at least some borders or sections
  - [ ] Figure out a menu structure - either native or in-app
  - [ ] Choose a good font-family
- [ ] CODE STRUCTURE
  - [ ] Analyze code structure and make changes (if any) to ensure the codebase is maintainable
- [ ] NAME
  - [ ] choose a name/brand for the application
  - [ ] Figure out an Icon
  - [ ] Ensure titlebar and all other areas have consistent naming / branding
- [ ] OTHER UI / APP STRUCTURE
  - [ ] HELP
    - [ ] Build in-app help / instructions
    - [ ] Work on documentation for application on website
  - [ ] MULTI-WINDOW
    - [ ] Allow multi-window support - should have one worker per window
  - [ ] CHANGELOG
    - [ ] create a changelog and expose it in the application
  - [ ] STATUS BAR
    - [ ] Build a status bar to show status of data processing
- [ ] WEBSITE
  - [ ] Build website for product
- [ ] AUTO-UPDATE
  - [ ] Figure out how to support auto-updates
- [ ] BUILD
  - [ ] Figure out how to build the application 
- [ ] AUTO-UPDATE
  - [ ] Figure out how to support auto-updates







# Introduction

Bootstrap and package your project with Angular 7 and Electron (Typescript + SASS + Hot Reload) for creating Desktop applications.

Currently runs with:

- Angular v7.1.4
- Electron v4.0.0
- Electron Builder v20.28.1

With this sample, you can :

- Run your app in a local development environment with Electron & Hot reload
- Run your app in a production environment
- Package your app into an executable file for Linux, Windows & Mac

## Getting Started

Clone this repository locally :

``` bash
git clone https://github.com/maximegris/angular-electron.git
```

Install dependencies with npm :

``` bash
npm install
```

There is an issue with `yarn` and `node_modules` that are only used in electron on the backend when the application is built by the packager. Please use `npm` as dependencies manager.


If you want to generate Angular components with Angular-cli , you **MUST** install `@angular/cli` in npm global context.
Please follow [Angular-cli documentation](https://github.com/angular/angular-cli) if you had installed a previous version of `angular-cli`.

``` bash
npm install -g @angular/cli
```

## To build for development

- **in a terminal window** -> npm start

Voila! You can use your Angular + Electron app in a local development environment with hot reload !

The application code is managed by `main.ts`. In this sample, the app runs with a simple Angular App (http://localhost:4200) and an Electron window.
The Angular component contains an example of Electron and NodeJS native lib import.
You can disable "Developer Tools" by commenting `win.webContents.openDevTools();` in `main.ts`.

## Included Commands

| Command                    | Description                                                                                                 |
| -------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `npm run ng:serve:web`     | Execute the app in the browser                                                                              |
| `npm run build`            | Build the app. Your built files are in the /dist folder.                                                    |
| `npm run build:prod`       | Build the app with Angular aot. Your built files are in the /dist folder.                                   |
| `npm run electron:local`   | Builds your application and start electron                                                                  |
| `npm run electron:linux`   | Builds your application and creates an app consumable on linux system                                       |
| `npm run electron:windows` | On a Windows OS, builds your application and creates an app consumable in windows 32/64 bit systems         |
| `npm run electron:mac`     | On a MAC OS, builds your application and generates a `.app` file of your application that can be run on Mac |

**Your application is optimised. Only /dist folder and node dependencies are included in the executable.**

## You want to use a specific lib (like rxjs) in electron main thread ?

You can do this! Just by importing your library in npm dependencies (not devDependencies) with `npm install --save`. It will be loaded by electron during build phase and added to the final package. Then use your library by importing it in `main.ts` file. Easy no ?

## Browser mode

Maybe you want to execute the application in the browser with hot reload ? You can do it with `npm run ng:serve:web`.
Note that you can't use Electron or NodeJS native libraries in this case. Please check `providers/electron.service.ts` to watch how conditional import of electron/Native libraries is done.

## Branch & Packages version

- Angular 4 & Electron 1 : Branch [angular4](https://github.com/maximegris/angular-electron/tree/angular4)
- Angular 5 & Electron 1 : Branch [angular5](https://github.com/maximegris/angular-electron/tree/angular5)
- Angular 6 & Electron 3 : Branch [angular6](https://github.com/maximegris/angular-electron/tree/angular6)
- Angular 7 & Electron 3 : (master)

[build-badge]: https://travis-ci.org/maximegris/angular-electron.svg?branch=master
[build]: https://travis-ci.org/maximegris/angular-electron.svg?branch=master
[dependencyci-badge]: https://dependencyci.com/github/maximegris/angular-electron/badge
[dependencyci]: https://dependencyci.com/github/maximegris/angular-electron
[license-badge]: https://img.shields.io/badge/license-Apache2-blue.svg?style=flat
[license]: https://github.com/maximegris/angular-electron/blob/master/LICENSE.md
[prs-badge]: https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square
[prs]: http://makeapullrequest.com
[github-watch-badge]: https://img.shields.io/github/watchers/maximegris/angular-electron.svg?style=social
[github-watch]: https://github.com/maximegris/angular-electron/watchers
[github-star-badge]: https://img.shields.io/github/stars/maximegris/angular-electron.svg?style=social
[github-star]: https://github.com/maximegris/angular-electron/stargazers
[twitter]: https://twitter.com/intent/tweet?text=Check%20out%20angular-electron!%20https://github.com/maximegris/angular-electron%20%F0%9F%91%8D
[twitter-badge]: https://img.shields.io/twitter/url/https/github.com/maximegris/angular-electron.svg?style=social
