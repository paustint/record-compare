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
      class: 'ui-button-raised',
      disabled: false,
      icon: 'pi pi-file',
      iconPos: 'right',
      action: this.onClickCompare.bind(this),
      tooltip: () => null,
    },
    {
      name: 'table',
      label: 'Compare as Table',
      class: 'ui-button-raised',
      disabled: false,
      icon: 'pi pi-table',
      iconPos: 'right',
      action: this.onClickCompare.bind(this),
      tooltip: (disabled: boolean) => (disabled ? 'Configure a key and field mapping to enable table comparison.' : null),
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
