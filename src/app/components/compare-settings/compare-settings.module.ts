import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompareSettingsKeyService } from './compare-settings-key/compare-settings-key.service';
import { CompareSettingsMappingService } from './compare-settings-mapping/compare-settings-mapping.service';
import { CompareSettingsComponent } from './compare-settings.component';
import { CompareSettingsMappingComponent } from './compare-settings-mapping/compare-settings-mapping.component';
import { CompareSettingsKeyComponent } from './compare-settings-key/compare-settings-key.component';
import { AppSharedModule } from '../../app.shared.module';

@NgModule({
  declarations: [CompareSettingsComponent, CompareSettingsMappingComponent, CompareSettingsKeyComponent],
  imports: [CommonModule, AppSharedModule],
  exports: [CompareSettingsComponent],
  providers: [CompareSettingsKeyService, CompareSettingsMappingService],
})
export class CompareSettingsModule {}
