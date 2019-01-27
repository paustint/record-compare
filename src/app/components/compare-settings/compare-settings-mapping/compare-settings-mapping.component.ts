import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CompareSettingsMappingService } from './compare-settings-mapping.service';

@Component({
  selector: 'app-compare-settings-mapping',
  templateUrl: './compare-settings-mapping.component.html',
  styleUrls: ['./compare-settings-mapping.component.scss'],
})
export class CompareSettingsMappingComponent implements OnInit {
  @Input() leftHeaders: string[] = [];
  @Input() rightHeaders: string[] = [];
  @Input() disabled = false;
  @Output() save = new EventEmitter<any>();
  @Output() close = new EventEmitter<void>();

  active = false;

  constructor(private mappingService: CompareSettingsMappingService) {}

  ngOnInit() {}

  onClose() {
    this.active = false;
    // TODO: reset changes?
  }

  onSave() {
    this.save.emit({});
  }
}
