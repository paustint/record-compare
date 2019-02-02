import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CompareSettingsKeyService } from './compare-settings-key.service';
import { LogService } from '../../../providers/log.service';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'app-compare-settings-key',
  templateUrl: './compare-settings-key.component.html',
  styleUrls: ['./compare-settings-key.component.scss'],
})
export class CompareSettingsKeyComponent implements OnInit {
  @Input()
  set leftHeaders(headers: string[]) {
    this._leftHeaders = headers;
    this.setHeaders();
  }
  @Input()
  set rightHeaders(headers: string[]) {
    this._rightHeaders = headers;
    this.setHeaders();
  }
  @Input() disabled = false;
  @Output() save = new EventEmitter<{ keys: string[] }>();
  @Output() close = new EventEmitter<void>();

  _leftHeaders: string[] = [];
  _rightHeaders: string[] = [];

  active = false;
  headers: SelectItem[];
  selectedHeaders: string[] = [];

  constructor(private keyService: CompareSettingsKeyService, private log: LogService) {}

  ngOnInit() {
    // This is not needed now, but if the component ever gets destroyed, this will save the selections
    this.selectedHeaders = this.keyService.selectedKeys;
  }

  setHeaders() {
    this.headers = this.keyService.mapHeadersToSelectedItem(this._leftHeaders, this._rightHeaders);
    // reset selected headers if content changes
    this.selectedHeaders = [];
    this.keyService.selectedKeys = this.selectedHeaders;
    this.save.emit({ keys: this.keyService.selectedKeys });
    this.keyService.setDisabledItems(this.headers, this.selectedHeaders);
  }

  onActive() {
    this.active = true;
  }

  onClose() {
    this.active = false;
    // TODO: reset changes?
  }

  onSave() {
    this.keyService.selectedKeys = this.selectedHeaders;
    this.save.emit({ keys: this.keyService.selectedKeys });
    this.active = false;
  }

  onChange(ev: any) {
    this.log.debug(ev);
    this.keyService.setDisabledItems(this.headers, this.selectedHeaders);
  }

  getSelectedText() {
    if (this.selectedHeaders.length > 0) {
      return this.selectedHeaders.join(' + ');
    } else {
      return 'none';
    }
  }
}
