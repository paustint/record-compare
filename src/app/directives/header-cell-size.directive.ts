import { Directive, ElementRef, Input } from '@angular/core';

@Directive({
  selector: '[appHeaderCellSize]',
})
export class HeaderCellSizeDirective {
  @Input() name: string;
  @Input() header: string;
  @Input() defaultWidth: number;

  private element: HTMLTableHeaderCellElement;

  constructor(private _el: ElementRef) {
    this.element = _el.nativeElement;
  }

  public getClientWidth() {
    if (this.element) {
      return this.element.clientWidth;
    } else if (this.header) {
      return this.header.length;
    } else {
      return this.defaultWidth || 25;
    }
  }

  public setWidth(width: number) {
    if (this.element) {
      this.element.style.minWidth = `${width}px`;
    }
  }
}
