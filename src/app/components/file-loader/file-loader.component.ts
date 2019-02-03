import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';
import { parse } from 'papaparse';
import { FileContentsEvent, FileType, FileStat } from '../../models';
import { FILETYPE_REGEX } from '../../constants';
import * as XLSX from 'xlsx';
import { LogService } from '../../providers/log.service';
import { AppService } from '../../providers/app.service';
import * as prettyBytes from 'pretty-bytes';
import { UtilsService } from '../../providers/utils.service';

@Component({
  selector: 'app-file-loader',
  templateUrl: './file-loader.component.html',
  styleUrls: ['./file-loader.component.scss'],
})
export class FileLoaderComponent implements OnInit {
  @Input() heading = 'Source File';
  @Output() fileContents = new EventEmitter<FileContentsEvent>();

  filename: string;
  fileStat: FileStat | undefined;
  type: FileType;
  prettySize: string;

  constructor(
    private electronService: ElectronService,
    private log: LogService,
    private appService: AppService,
    private utils: UtilsService
  ) {}

  ngOnInit() {}

  public async openFileDialog() {
    const filePath = this.electronService.dialog.showOpenDialog({ properties: ['openFile', 'createDirectory'] });
    // CSV (TODO: check file extension and take action accordingly)
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
  }

  private async parseFile(filename: string) {
    // FIXME: handle errors - what if empty file, no headers, etc..
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
          },
          complete: () => {
            // never called if preview is set
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
    this.prettySize = prettyBytes(fileStat.size, { locale: this.utils.getLanguage() });
  }
}
