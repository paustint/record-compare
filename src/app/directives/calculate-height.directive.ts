import { Directive, ElementRef, OnDestroy, HostListener, Input } from '@angular/core';
import { LogService } from '../providers/log.service';

@Directive({
  selector: '[appCalculateHeight]',
})
export class CalculateHeightDirective implements OnDestroy {
  @Input() footerHeight = 56;
  private element: HTMLElement;
  private top: number;
  private observer: MutationObserver;

  constructor(_el: ElementRef, private log: LogService) {
    this.element = _el.nativeElement;
    this.top = this.getElementOffsetTop();
    if (this.element.getBoundingClientRect().top === 0) {
      // View is not yet fully rendered, so we need to wait until the render is finished
      // to get an accurate top bondary
      setTimeout(() => {
        this.calculateAndSetElementHeight();
      });
    } else {
      this.calculateAndSetElementHeight();
    }

    this.observer = new MutationObserver(mutations => {
      if (this.top !== this.getElementOffsetTop()) {
        this.calculateAndSetElementHeight();
        this.top = this.getElementOffsetTop();
      }
    });
  }

  ngOnDestroy(): void {
    this.observer.disconnect();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event) {
    // this.log.debug('window:resize event fired.');
    this.calculateAndSetElementHeight();
  }

  public calculateAndSetElementHeight() {
    // this.log.debug('calculateAndSetElementHeight()');
    this.element.style.overflow = 'auto';
    const windowHeight = window.innerHeight;
    const elementOffsetTop = this.getElementOffsetTop();
    const elementMarginBottom = this.footerHeight;
    const maxHeight = windowHeight - elementMarginBottom - elementOffsetTop;
    // this.log.debug('new MaxHeight: ' + maxHeight);
    this.element.style.height = maxHeight + 'px';
    // this.log.debug([windowHeight, elementOffsetTop, elementMarginBottom, footerElementMargin, this.element.style.maxHeight]);
    this.top = elementOffsetTop;
  }

  private getElementOffsetTop() {
    return this.element.getBoundingClientRect().top;
  }
}
