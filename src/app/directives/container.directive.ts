import { Directive, Input, ElementRef } from '@angular/core';

@Directive({
  selector: '[appContainer]',
})
export class ContainerDirective {
  @Input() id: string;

  element: HTMLTableHeaderCellElement;

  constructor(private _el: ElementRef) {
    this.element = _el.nativeElement;
  }
}
