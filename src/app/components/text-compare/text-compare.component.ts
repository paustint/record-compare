import { Component, OnInit, Input, HostListener, AfterViewInit, ElementRef, ViewChild } from '@angular/core';

const NUM_ROWS_INIT = 30;
const NUM_ROWS_COMAPRE_ACTIVE = 5;

@Component({
  selector: 'app-text-compare',
  templateUrl: './text-compare.component.html',
  styleUrls: ['./text-compare.component.scss'],
})
export class TextCompareComponent implements OnInit, AfterViewInit {
  @ViewChild('topContent') topContent: ElementRef<HTMLDivElement>;
  @Input() parentContentHeight = 0;
  contentHeight: number;
  left: string;
  right: string;
  numRows = NUM_ROWS_INIT;
  compareActive = false;

  containerStyle = {
    height: '500px',
  };

  constructor() {}

  ngOnInit() {}

  ngAfterViewInit() {
    this.calculateContentHeight();
  }

  textFocus() {
    this.numRows = NUM_ROWS_INIT;
    this.compareActive = false;
  }

  compare() {
    this.compareActive = true;
    this.numRows = NUM_ROWS_COMAPRE_ACTIVE;
    setTimeout(() => {
      this.calculateContentHeight();
    });
  }

  @HostListener('window:resize', ['$event'])
  onResize() {
    this.calculateContentHeight();
  }

  calculateContentHeight() {
    this.contentHeight = window.innerHeight - this.parentContentHeight - this.topContent.nativeElement.clientHeight;
    this.containerStyle.height = `${this.contentHeight}px`;
  }
}
