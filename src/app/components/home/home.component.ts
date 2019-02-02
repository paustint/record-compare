import { Component, OnInit, ViewChild, HostListener, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import {
  FileContentsEvent,
  MatchRows,
  CompareType,
  LeftRight,
  DiffMetadata,
  CompareSettings,
  WorkerEvent,
  WorkerEventCompare,
} from '../../models';
import { ComparisonService } from '../../providers/comparison.service';
import { LogService } from '../../providers/log.service';
import { AppService } from '../../providers/app.service';
import { ElectronService } from '../../providers/electron.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  _content: ElementRef<HTMLDivElement>;
  @ViewChild('header') header: ElementRef<HTMLDivElement>;
  @ViewChild('footer') footer: ElementRef<HTMLDivElement>;
  @ViewChild('contentConfig') contentConfig: ElementRef<HTMLDivElement>;
  @ViewChild('content')
  get content() {
    return this._content;
  }
  set content(content: ElementRef<HTMLDivElement>) {
    this.contentHeight = content.nativeElement.clientHeight - 50;
    this._content = content;
  }

  contentHeight: number;

  left: FileContentsEvent;
  right: FileContentsEvent;
  tableDiffMetadata: DiffMetadata;

  matchedRows: MatchRows;

  compareActive = false;
  compareType: CompareType;
  // TODO: use this to figure out what buttons are enabled
  // Button component is inverse of this :( - maybe use setter
  allowedCompareTypes: CompareType[] = [];
  settings: CompareSettings;
  disableButtons = {
    all: true,
    text: true,
    table: true,
  };

  constructor(
    private electron: ElectronService,
    private comparison: ComparisonService,
    private log: LogService,
    private appService: AppService,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.appService.loading$.subscribe(loading => {
      if (loading) {
        this.disableButtons = {
          all: true,
          text: true,
          table: true,
        };
      } else {
        this.updateDisabledButtons();
      }
    });

    this.electron.workerEvents$.subscribe(results => {
      console.log('[TEST] EVENT', results);
    });
  }

  ngAfterViewInit() {
    this.calculateContentHeight();
  }

  onSettingsChanged(settings: CompareSettings) {
    this.settings = settings;
    this.updateDisabledButtons();
  }

  onFileContents(which: LeftRight, contents: FileContentsEvent) {
    this.log.debug('onFileContents', which, contents);
    if (which === 'left') {
      this.left = contents;
    } else {
      this.right = contents;
    }
    // TODO: derive data type
    if (this.isTable()) {
      this.allowedCompareTypes = ['text', 'table'];
      this.compareType = 'table'; // set as default to allow settings to enable
    } else {
      this.allowedCompareTypes = ['text'];
    }
    // turn off compare if a new file was loaded
    // TODO: is this the right action?
    this.compareActive = false;
    this.updateDisabledButtons();
  }

  async onCompare(compareType: CompareType) {
    // this.compareUsingRenderer(compareType);
    // this.compareUsingWorkerIPC(compareType);
    this.compareUsingWorkerBinary(compareType);
  }

  // async compareUsingRenderer(compareType: CompareType) {
  //   this.appService.loading = true;
  //   this.compareType = compareType;
  //   this.compareActive = true;
  //   if (compareType === 'table') {
  //     if ((this.left.type === 'csv' || this.left.type === 'xlsx') && (this.right.type === 'csv' || this.right.type === 'xlsx')) {
  //       // TODO: fix key field! (allow user input)
  //       // TODO: fix fields to compare! (allow user input)
  //       this.log.time('compareData');
  //       this.matchedRows = await this.comparison.compareTableData(this.left.parsed, this.right.parsed, {
  //         keyFields: this.settings.keys[0],
  //         fieldsToCompare: this.left.headers,
  //         keyIgnoreCase: this.settings.keyIgnoreCase,
  //       });
  //       this.tableDiffMetadata = this.matchedRows.diffMetadata;
  //       this.log.timeEnd('compareData');
  //     } else {
  //       // TODO: data is in incompatible format (e.x. text vs table)
  //     }
  //   } else {
  //     // TODO: store text variables somewhere
  //     // can use ngTextDiff
  //   }
  //   this.appService.loading = false;
  // }

  async compareUsingWorkerBinary(compareType: CompareType) {
    this.appService.loading = true;
    this.compareType = compareType;
    if (compareType === 'table') {
      if ((this.left.type === 'csv' || this.left.type === 'xlsx') && (this.right.type === 'csv' || this.right.type === 'xlsx')) {
        this.log.time('compare data');
        // const fileName = this.electron.path.join(this.electron.tempPath, 'record-compare.tempfile.json');
        // this.log.debug('temp fileName', fileName);
        // await this.electron.fs.writeJSON(fileName, {
        //   left: this.left.parsed,
        //   right: this.right.parsed,
        //   options: {
        //     keyFields: this.settings.keys[0],
        //     fieldsToCompare: this.left.headers,
        //     keyIgnoreCase: this.settings.keyIgnoreCase,
        //   },
        // });

        const writeStream = this.electron.binaryClient.send(
          JSON.stringify({
            name: 'COMPARE_TABLE',
            payload: {
              left: this.left,
              right: this.right,
              options: {
                keyFields: this.settings.keys[0],
                fieldsToCompare: this.left.headers,
                keyIgnoreCase: this.settings.keyIgnoreCase,
              },
            },
          })
        );

        writeStream.end();

        this.electron.binaryClient.on('stream', readStream => {
          let parts = '';
          let results: WorkerEvent<WorkerEventCompare>;
          readStream.on('data', data => {
            console.log('client:stream:data');
            parts += data;
          });
          readStream.on('end', async () => {
            console.log('client:stream:end', parts);
            results = JSON.parse(parts);
            this.matchedRows = await this.electron.fs.readJSON(results.payload.filename);
            // this.matchedRows = results.payload;
            // this.tableDiffMetadata = this.matchedRows.diffMetadata; // commenting out to test performance
            // this.compareActive = true;
            this.appService.loading = false;
            this.log.timeEnd('compare data');
            this.cd.detectChanges();
          });
        });

        // const sub = this.electron.workerEvents$.pipe(filter(ev => ev.name === 'COMPARE_TABLE')).subscribe(results => {
        //   this.matchedRows = results.payload;
        //   this.tableDiffMetadata = this.matchedRows.diffMetadata;
        //   this.compareActive = true;
        //   this.appService.loading = false;
        //   this.log.timeEnd('compareData');
        //   sub.unsubscribe();
        //   this.cd.detectChanges();
        // });
      } else {
        // TODO: data is in incompatible format (e.x. text vs table)
      }
    } else {
      // TODO: store text variables somewhere
      // can use ngTextDiff
    }
  }

  // async compareUsingWorkerIPC(compareType: CompareType) {
  //   this.appService.loading = true;
  //   this.compareType = compareType;
  //   if (compareType === 'table') {
  //     if ((this.left.type === 'csv' || this.left.type === 'xlsx') && (this.right.type === 'csv' || this.right.type === 'xlsx')) {
  //       this.log.time('compareData');
  //       this.electron.sendEventToWorker('COMPARE_TABLE', {
  //         left: this.left.parsed,
  //         right: this.right.parsed,
  //         options: {
  //           keyFields: this.settings.keys[0],
  //           fieldsToCompare: this.left.headers,
  //           keyIgnoreCase: this.settings.keyIgnoreCase,
  //         },
  //       });

  //       const sub = this.electron.workerEvents$.pipe(filter(ev => ev.name === 'COMPARE_TABLE')).subscribe(results => {
  //         this.matchedRows = results.payload;
  //         this.tableDiffMetadata = this.matchedRows.diffMetadata;
  //         this.compareActive = true;
  //         this.appService.loading = false;
  //         this.log.timeEnd('compareData');
  //         sub.unsubscribe();
  //         this.cd.detectChanges();
  //       });
  //     } else {
  //       // TODO: data is in incompatible format (e.x. text vs table)
  //     }
  //   } else {
  //     // TODO: store text variables somewhere
  //     // can use ngTextDiff
  //   }
  // }

  isTable() {
    if (this.left && this.right) {
      if ((this.left.type === 'csv' || this.left.type === 'xlsx') && (this.right.type === 'csv' || this.right.type === 'xlsx')) {
        return true;
      }
    }
    return false;
  }

  updateDisabledButtons(compareType?: CompareType): void {
    // ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      if (!this.left || !this.right) {
        this.disableButtons = {
          all: true,
          table: true,
          text: true,
        };
      } else if (this.isTable()) {
        const invalidSettings = !this.settings || !this.settings.keys || this.settings.keys.length === 0 ? true : false;
        this.disableButtons = {
          all: false,
          table: invalidSettings,
          text: false,
        };
      } else {
        this.disableButtons = {
          all: false,
          table: true,
          text: false,
        };
      }
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.calculateContentHeight();
  }

  calculateContentHeight() {
    this.contentHeight =
      window.innerHeight -
      this.header.nativeElement.clientHeight -
      this.footer.nativeElement.clientHeight -
      this.contentConfig.nativeElement.clientHeight -
      50;
  }
}
