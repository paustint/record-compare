import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import { DiffContent } from 'ngx-text-diff/lib/ngx-text-diff.model';
import { Subject } from 'rxjs';

@Component({
  selector: 'app-compare-text',
  templateUrl: './compare-text.component.html',
  styleUrls: ['./compare-text.component.scss'],
})
export class CompareTextComponent implements OnInit, OnChanges {
  @Input() left: string;
  @Input() right: string;

  diffContentSubject = new Subject<DiffContent>();
  diffContent$ = this.diffContentSubject.asObservable();

  constructor() {}

  ngOnInit() {}

  ngOnChanges(changes: SimpleChanges) {
    if (this.left && this.right) {
      this.diffContentSubject.next({
        leftContent: this.left,
        rightContent: this.right,
      });
    }
  }
}
