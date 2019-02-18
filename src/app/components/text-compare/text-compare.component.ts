import { Component, OnInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { StateService } from '../../providers/state.service';

const NUM_ROWS_INIT = 30;
const NUM_ROWS_COMAPRE_ACTIVE = 5;

@Component({
  selector: 'app-text-compare',
  templateUrl: './text-compare.component.html',
  styleUrls: ['./text-compare.component.scss'],
})
export class TextCompareComponent implements OnInit, OnDestroy {
  left: string;
  right: string;
  numRows = NUM_ROWS_INIT;
  compareActive = false;

  constructor(private stateService: StateService, private cd: ChangeDetectorRef) {}

  ngOnInit() {
    if (this.stateService.restoreState('compareText', this)) {
      this.cd.detectChanges();
    }
  }

  ngOnDestroy() {
    this.stateService.setState('compareText', {
      left: this.left,
      right: this.right,
      numRows: this.numRows,
      compareActive: this.compareActive,
    });
  }

  textFocus() {
    this.numRows = NUM_ROWS_INIT;
    this.compareActive = false;
  }

  compare(ev?: KeyboardEvent) {
    if (ev) {
      ev.preventDefault();
    }
    if (this.left && this.right) {
      this.compareActive = true;
      this.numRows = NUM_ROWS_COMAPRE_ACTIVE;
    }
  }
}
