import { Component, OnInit, Input, Output, EventEmitter, ChangeDetectorRef, NgZone } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';
import { parse } from 'papaparse';
import { FileContentsEvent, FileType, FileStat } from '../../models';
import { FILETYPE_REGEX } from '../../constants';
import * as XLSX from 'xlsx';
import { LogService } from '../../providers/log.service';
import { AppService } from '../../providers/app.service';
import * as prettyBytes from 'pretty-bytes';
import { UtilsService } from '../../providers/utils.service';
import * as _ from 'lodash';

@Component({
  selector: 'app-file-loader',
  templateUrl: './file-loader.component.html',
  styleUrls: ['./file-loader.component.scss'],
})
export class FileLoaderComponent implements OnInit {
  @Input() heading = 'Source File';
  @Output() fileContents = new EventEmitter<FileContentsEvent>();
  @Input()
  set file(fileEv: FileContentsEvent) {
    // CD was causing this to fire mid-event when loading was set to true
    // parseInProgress ensures that incoming data is ignored
    // FIXME: consider how the loading indicator works
    if (!this.parseInProgress && fileEv) {
      this.fileStat = fileEv.fileStat;
      this.filename = fileEv.filename;
      this.type = fileEv.type;
    }
  }
  private _fileStat: FileStat | undefined;
  set fileStat(fileStat: FileStat | undefined) {
    if (fileStat && _.isNumber(fileStat.size)) {
      this.prettySize = prettyBytes(fileStat.size, { locale: this.utils.getLanguage() });
    }
    this._fileStat = fileStat;
  }
  get fileStat(): FileStat | undefined {
    return this._fileStat;
  }
  filename: string;

  type: FileType;
  prettySize: string;
  dragOverActive = false;
  errorMessage: string;
  parseInProgress = false;

  constructor(
    private electronService: ElectronService,
    private log: LogService,
    private appService: AppService,
    private utils: UtilsService,
    private zone: NgZone,
    private cd: ChangeDetectorRef
  ) {}

  ngOnInit() {}

  onDragOver(event: any) {
    this.dragOverActive = true;
    event.stopPropagation();
    event.preventDefault();
  }
  onDragLeave(event: any) {
    this.dragOverActive = false;
    event.stopPropagation();
    event.preventDefault();
  }
  async dropFiles(event: any) {
    this.dragOverActive = false;
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
      let items: FileList | DataTransferItemList;
      if (event.dataTransfer.items) {
        items = event.dataTransfer.items;
      } else {
        items = event.dataTransfer.files;
      }
      if (items && items.length > 0) {
        this.log.debug('event.dataTransfer.files', event.dataTransfer.files);
        if (event.dataTransfer.files[0]) {
          this.readFile([event.dataTransfer.files[0].path]);
        }
      }
    }
    event.stopPropagation();
    event.preventDefault();
  }

  public openFileDialog() {
    const filePath = this.electronService.dialog.showOpenDialog(this.electronService.remote.getCurrentWindow(), {
      properties: ['openFile', 'createDirectory'],
    });
    this.readFile(filePath);
  }

  private async readFile(filePath: string[]) {
    this.parseInProgress = true;
    this.errorMessage = undefined;
    if (filePath && filePath.length > 0) {
      this.filename = filePath[0];
      this.appService.loading = true;
      try {
        await this.getFileStats(this.filename);
        await this.parseFile(this.filename);
      } catch (ex) {
        console.error('error reading file', ex);
      } finally {
        this.appService.loading = false;
      }
    }
    this.parseInProgress = false;
  }

  private clearFile() {
    this.filename = undefined;
    this.fileStat = undefined;
    this.type = undefined;
    this.cd.detectChanges();
  }

  private async parseFile(filename: string) {
    try {
      if (FILETYPE_REGEX.CSV.test(filename)) {
        // CSV
        this.type = 'csv';
        parse(this.electronService.fs.createReadStream(filename, 'utf-8'), {
          preview: 1,
          header: true,
          skipEmptyLines: true,
          step: row => {
            this.log.debug('CSV parsed row');
            this.fileContents.emit({
              type: 'csv',
              fileStat: this.fileStat,
              filename,
              headers: row.meta.fields,
            });
          },
          error: error => {
            this.log.debug('Errors parsing file', error);
            this.errorMessage = `There was an error reading the file.  Row: ${error.row}, error: ${error.message}`;
            this.fileContents.emit(undefined);
          },
          complete: () => {
            // never called if preview is set
            this.log.debug('File contained no data');
            this.errorMessage = 'The file did not contain any rows';
            this.clearFile();
            this.fileContents.emit(undefined);
          },
        });
      } else if (FILETYPE_REGEX.XLSX.test(filename)) {
        // XLSX
        this.type = 'xlsx';
        this.log.time('read xlsx');
        const fileContents = await this.electronService.fs.readFile(filename);
        const workbook = XLSX.read(fileContents, { type: 'buffer', sheetRows: 2, cellFormula: false, cellHTML: false });
        this.log.timeEnd('read xlsx');

        this.log.time('parse xlsx');
        const parsed = XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { defval: '', raw: true });
        const headers = Object.keys(parsed[0]);
        this.log.timeEnd('parse xlsx');

        this.fileContents.emit({
          type: 'xlsx',
          fileStat: this.fileStat,
          filename,
          headers,
        });
      } else {
        // TEXT
        this.type = 'text';

        this.fileContents.emit({
          type: 'text',
          fileStat: this.fileStat,
          filename,
        });
      }
    } catch (ex) {
      this.log.debug('Error reading file', ex);
    }
  }

  private async getFileStats(filename: string) {
    const fileStat = await this.electronService.fs.stat(filename);
    this.log.debug('fileStat', fileStat);
    this.fileStat = {
      size: fileStat.size,
      created: fileStat.ctime,
      modified: fileStat.mtime,
    };
  }
}
