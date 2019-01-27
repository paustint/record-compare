import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareTextComponent } from './compare-text.component';

describe('CompareTextComponent', () => {
  let component: CompareTextComponent;
  let fixture: ComponentFixture<CompareTextComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompareTextComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareTextComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
