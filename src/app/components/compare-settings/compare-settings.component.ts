import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CompareType, CompareSettings } from '../../models';

@Component({
  selector: 'app-compare-settings',
  templateUrl: './compare-settings.component.html',
  styleUrls: ['./compare-settings.component.scss'],
})
export class CompareSettingsComponent implements OnInit {
  @Input() key: string;
  @Input() leftHeaders: string[] = [];
  @Input() rightHeaders: string[] = [];
  @Input() disabled = false;
  @Input() type: CompareType = 'table';
  @Output() settingsChanged = new EventEmitter<CompareSettings>();

  activeModals = {
    key: false,
    mapping: false,
  };

  settings: CompareSettings = {
    keys: [],
    mapping: {},
  };

  constructor() {}

  ngOnInit() {}

  showKeyModal() {
    this.activeModals.key = true;
  }

  showMappingModal() {
    this.activeModals.mapping = true;
  }

  onClose() {
    // emit settings
    this.activeModals.key = false;
    this.activeModals.mapping = false;
  }

  onSaveKeys(data: { keys: string[] }) {
    this.settings.keys = data.keys;
    this.settingsChanged.emit(this.settings);
  }
  onSaveMapping(data: { mapping: { [source: string]: string } }) {
    this.settings.mapping = data.mapping;
    this.settingsChanged.emit(this.settings);
  }
}
