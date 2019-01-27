import { Component, OnInit, ViewChild, HostListener, ElementRef, AfterViewInit } from '@angular/core';
import { FileContentsEvent, MatchRows, CompareType, LeftRight, DiffMetadata } from '../../models';
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

  constructor(private comparison: ComparisonService, private log: LogService, private appService: AppService) {}

  ngOnInit() {
    setTimeout(() => {
      this.appService.loading = true;
    }, 2000);
  }

  ngAfterViewInit() {
    this.calculateContentHeight();
  }

  onFileContents(which: LeftRight, contents: FileContentsEvent) {
    if (which === 'left') {
      this.left = contents;
    } else {
      this.right = contents;
    }
  }

  async onClickCompare(compareType: CompareType) {
    this.appService.loading = true;
    this.compareType = compareType;
    this.compareActive = true;
    if (compareType === 'table') {
      if ((this.left.type === 'csv' || this.left.type === 'xlsx') && (this.right.type === 'csv' || this.right.type === 'xlsx')) {
        // TODO: fix key field! (allow user input)
        // TODO: fix fields to compare! (allow user input)
        this.log.time('compareData');
        this.matchedRows = await this.comparison.compareTableData('Email Address', this.left.headers, this.left.parsed, this.right.parsed);
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
