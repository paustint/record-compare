import { Component, OnInit, ViewChild, HostListener, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FileContentsEvent, MatchRows, CompareType, LeftRight, DiffMetadata, CompareSettings } from '../../models';
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
      this.cd.detectChanges();
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
    this.appService.loading = true;
    this.compareType = compareType;
    if (compareType === 'table') {
      if ((this.left.type === 'csv' || this.left.type === 'xlsx') && (this.right.type === 'csv' || this.right.type === 'xlsx')) {
        try {
          this.comparison.compareTableData(this.left, this.right, {
            keyFields: this.settings.keys[0],
            mapping: this.settings.mapping,
            keyIgnoreCase: this.settings.keyIgnoreCase,
          });
        } catch (ex) {
          this.log.debug('Error comparing', ex);
        }
      } else {
        // TODO: data is in incompatible format (e.x. text vs table)
      }
    } else {
      // TODO: store text variables somewhere
      // can use ngTextDiff
    }
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
