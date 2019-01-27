import { Component, OnInit, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { CompareType, CompareButton } from '../../models';

@Component({
  selector: 'app-compare-buttons',
  templateUrl: './compare-buttons.component.html',
  styleUrls: ['./compare-buttons.component.scss'],
})
export class CompareButtonsComponent implements OnInit, OnChanges {
  @Input() allDisabled = false;
  @Input() textDisabled = false;
  @Input() tableDisabled = false;
  @Output() compare = new EventEmitter<CompareType>();

  buttons: CompareButton[] = [
    {
      name: 'text',
      label: 'Compare as Text',
      class: '',
      disabled: false,
      icon: 'pi pi-file',
      iconPos: 'right',
      action: this.onClickCompare.bind(this),
    },
    {
      name: 'table',
      label: 'Compare as Table',
      class: '',
      disabled: false,
      icon: 'pi pi-table',
      iconPos: 'right',
      action: this.onClickCompare.bind(this),
    },
  ];

  constructor() {}

  ngOnInit() {
    this.updateDisabledButtons();
  }

  ngOnChanges(changes: SimpleChanges) {
    this.updateDisabledButtons();
  }

  updateDisabledButtons() {
    this.buttons.forEach(btn => {
      if (this.allDisabled) {
        btn.disabled = true;
      } else {
        switch (btn.name) {
          case 'text':
            btn.disabled = this.textDisabled ? true : false;
            break;
          case 'table':
            btn.disabled = this.tableDisabled ? true : false;
            break;
          default:
            btn.disabled = false;
            break;
        }
      }
    });
  }

  onClickCompare(type: CompareType) {
    this.compare.emit(type);
  }
}
