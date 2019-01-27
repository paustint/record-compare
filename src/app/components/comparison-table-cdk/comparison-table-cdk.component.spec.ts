import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ComparisonTableCdkComponent } from './comparison-table-cdk.component';

describe('ComparisonTableCdkComponent', () => {
  let component: ComparisonTableCdkComponent;
  let fixture: ComponentFixture<ComparisonTableCdkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ComparisonTableCdkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ComparisonTableCdkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
