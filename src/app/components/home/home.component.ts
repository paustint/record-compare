import { Component, OnInit, ViewChild, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { FileContentsEvent, MatchRows, CompareType, LeftRight, DiffMetadata, CompareSettings } from '../../models';
import { Observable, Subject } from 'rxjs';
import { DiffContent } from 'ngx-text-diff/lib/ngx-text-diff.model';
import { ComparisonService } from '../../providers/comparison.service';
import { LogService } from '../../providers/log.service';
import { AppService } from '../../providers/app.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit, AfterViewInit {
  _content: ElementRef<HTMLDivElement>;
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

  constructor(private comparison: ComparisonService, private log: LogService, private appService: AppService) {}

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
  }

  ngAfterViewInit() {
    this.calculateContentHeight();
  }

  onSettingsChanged(settings: CompareSettings) {
    this.settings = settings;
    this.updateDisabledButtons();
  }

  onFileContents(which: LeftRight, contents: FileContentsEvent) {
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
    this.appService.loading = true;
    this.compareType = compareType;
    this.compareActive = true;
    if (compareType === 'table') {
      if ((this.left.type === 'csv' || this.left.type === 'xlsx') && (this.right.type === 'csv' || this.right.type === 'xlsx')) {
        // TODO: fix key field! (allow user input)
        // TODO: fix fields to compare! (allow user input)
        this.log.time('compareData');
        this.matchedRows = await this.comparison.compareTableData(
          this.settings.keys[0],
          this.left.headers,
          this.left.parsed,
          this.right.parsed
        );
        this.tableDiffMetadata = this.matchedRows.diffMetadata;
        this.log.timeEnd('compareData');
      } else {
        // TODO: data is in incompatible format (e.x. text vs table)
      }
    } else {
      // TODO: store text variables somewhere
      // can use ngTextDiff
    }
    this.appService.loading = false;
  }

  isTable() {
    if (this.left && this.right) {
      if ((this.left.type === 'csv' || this.left.type === 'xlsx') && (this.right.type === 'csv' || this.right.type === 'xlsx')) {
        return true;
      }
    }
    return false;
  }

  updateDisabledButtons(compareType?: CompareType): void {
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
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.calculateContentHeight();
  }

  calculateContentHeight() {
    this.contentHeight = this.content.nativeElement.clientHeight - 100;
    // setTimeout(() => {
    //   this.contentHeight = this.content.nativeElement.clientHeight - 50;
    // });
  }
}
