import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompareSettingsComponent } from './compare-settings.component';

describe('CompareSettingsComponent', () => {
  let component: CompareSettingsComponent;
  let fixture: ComponentFixture<CompareSettingsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CompareSettingsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompareSettingsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
