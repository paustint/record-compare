import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { ElectronService } from '../../providers/electron.service';
import { parse } from 'papaparse';
import { FileContentsEvent, FileType, FileStat } from '../../models';
import { FILETYPE_REGEX } from '../../constants';
import * as XLSX from 'xlsx';
import { LogService } from '../../providers/log.service';
import { AppService } from '../../providers/app.service';

@Component({
  selector: 'app-file-loader',
  templateUrl: './file-loader.component.html',
  styleUrls: ['./file-loader.component.scss'],
})
export class FileLoaderComponent implements OnInit {
  @Input() heading = 'Source File';
  @Output() fileContents = new EventEmitter<FileContentsEvent>();
  // TODO:
  // @Output() fileReadError = new EventEmitter<FileContentsEvent>();

  filename: string;
  fileStat: FileStat | undefined;
  type: FileType;

  constructor(private electronService: ElectronService, private log: LogService, private appService: AppService) {}

  ngOnInit() {}

  public async openFileDialog() {
    const filePath = this.electronService.dialog.showOpenDialog({ properties: ['openFile', 'createDirectory'] });
    // CSV (TODO: check file extension and take action accordingly)
    if (filePath && filePath.length > 0) {
      this.filename = filePath[0];
      this.appService.loading = true;
      try {
        await this.parseFile(this.filename);
        await this.getFileStats(this.filename);
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

        const fileContents = await this.electronService.fs.readFile(filename, 'utf-8');
        const parseResults = parse(fileContents, { skipEmptyLines: true, header: true });
        if (parseResults.errors.length > 0) {
          this.log.debug('Errors parsing file', parseResults.errors);
        } else {
          this.log.debug(parseResults.data);
          this.fileContents.emit({ parsed: parseResults.data, raw: fileContents, headers: parseResults.meta.fields, type: 'csv' });
        }
      } else if (FILETYPE_REGEX.XLSX.test(filename)) {
        // XLSX
        this.type = 'xlsx';

        const fileContents = await this.electronService.fs.readFile(filename);
        const workbook = XLSX.read(fileContents, { type: 'buffer' });
        const worksheet = workbook.Sheets[workbook.SheetNames[0]];
        const parsed = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: true });
        const headers = Object.keys(parsed[0]);

        this.fileContents.emit({ parsed, headers, type: 'xlsx' });
      } else {
        // TEXT
        this.type = 'text';

        const fileContents = await this.electronService.fs.readFile(filename, 'utf-8');
        this.fileContents.emit({ raw: fileContents, type: 'text' });
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
