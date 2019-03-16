import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { MappedHeadingItemRow } from '../../../models';
import { LogService } from '../../../providers/log.service';
import { CompareSettingsMappingService } from './compare-settings-mapping.service';

@Component({
  selector: 'app-compare-settings-mapping',
  templateUrl: './compare-settings-mapping.component.html',
  styleUrls: ['./compare-settings-mapping.component.scss'],
})
export class CompareSettingsMappingComponent implements OnInit {
  _leftHeaders: string[];
  _rightHeaders: string[];
  @Input()
  set leftHeaders(leftHeaders: string[]) {
    this._leftHeaders = leftHeaders;
    this.mapColumns();
  }
  get leftHeaders() {
    return this._leftHeaders || [];
  }
  @Input()
  set rightHeaders(rightHeaders: string[]) {
    this._rightHeaders = rightHeaders;
    this.mapColumns();
  }
  get rightHeaders() {
    return this._rightHeaders || [];
  }
  @Input() disabled = false;
  @Input() mappedHeaders: MappedHeadingItemRow[];
  @Output() mapped = new EventEmitter<MappedHeadingItemRow[]>();

  active = false;
  columns = ['Left Field', 'Right Field'];
  isInit = false;

  constructor(private mappingService: CompareSettingsMappingService, private log: LogService) {}

  ngOnInit() {
    this.isInit = true;
  }

  mapColumns() {
    if (this.isInit) {
      this.mappedHeaders = this.mappingService.autoMap(this.leftHeaders, this.rightHeaders);
      this.log.debug('mappedHeaders', this.mappedHeaders);
      setTimeout(() => {
        this.mapped.emit(this.mappedHeaders);
      });
    }
  }

  onActive() {
    this.active = true;
  }

  onSave() {
    this.active = false;
    this.mapped.emit(this.mappedHeaders);
  }
}
