import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CompareType, CompareSettings, OtherCompareTypes, MatchedItemRow } from '../../models';
import { SelectItem } from 'primeng/api';

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

  otherSettings: SelectItem[] = [
    { label: 'Case-Insensitive Key', value: 'keyIgnoreCase' },
    // TODO: enable in future
    // { label: 'Case-Insensitive Comparison', value: 'compareIgnoreCase' },
  ];
  selectedOtherSettings: string[] = [];

  settings: CompareSettings = {
    keys: [],
    mapping: {},
    keyIgnoreCase: false,
    compareIgnoreCase: false,
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

  onFieldsMapped(matchedItems: MatchedItemRow[]) {
    this.settings.mapping = matchedItems.reduce((mappings: { [left: string]: string }, item) => {
      if (item.right) {
        mappings[item.left] = item.right;
      }
      return mappings;
    }, {});
    this.settingsChanged.emit(this.settings);
  }

  onOtherSettingsChanged(value: OtherCompareTypes) {
    this.settings.keyIgnoreCase = this.selectedOtherSettings.find(val => val === 'keyIgnoreCase') ? true : false;
    this.settings.compareIgnoreCase = this.selectedOtherSettings.find(val => val === 'compareIgnoreCase') ? true : false;
    this.settingsChanged.emit(this.settings);
  }
}
