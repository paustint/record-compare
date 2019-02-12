import { Component, OnInit, Input, OnChanges, SimpleChanges, OnDestroy } from '@angular/core';
import { DiffContent } from 'ngx-text-diff/lib/ngx-text-diff.model';
import { Subject } from 'rxjs';
import { ElectronService } from '../../providers/electron.service';
import { LogService } from '../../providers/log.service';

@Component({
  selector: 'app-compare-text',
  templateUrl: './compare-text.component.html',
  styleUrls: ['./compare-text.component.scss'],
})
export class CompareTextComponent implements OnInit, OnChanges, OnDestroy {
  @Input() left: string;
  @Input() right: string;
  @Input() leftFile: string;
  @Input() rightFile: string;

  diffContentSubject = new Subject<DiffContent>();
  diffContent$ = this.diffContentSubject.asObservable();

  constructor(private electron: ElectronService, private log: LogService) {}

  ngOnInit() {}

  ngOnDestroy() {}

  async ngOnChanges(changes: SimpleChanges) {
    if (changes.leftFile && changes.leftFile.currentValue !== changes.leftFile.previousValue) {
      this.log.debug('Reading leftFile', changes.leftFile.currentValue);
      this.left = await this.electron.fs.readFile(changes.leftFile.currentValue, 'utf-8');
    }
    if (changes.rightFile && changes.rightFile.currentValue !== changes.rightFile.previousValue) {
      this.log.debug('Reading rightFil', changes.rightFile.currentValue);
      this.right = await this.electron.fs.readFile(changes.rightFile.currentValue, 'utf-8');
    }
    if (this.left && this.right) {
      this.diffContentSubject.next({
        leftContent: this.left,
        rightContent: this.right,
      });
    }
  }
}
