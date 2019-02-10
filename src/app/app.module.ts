import 'reflect-metadata';
import '../polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';

import { HttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { FileLoaderComponent } from './components/file-loader/file-loader.component';
import { CompareTextComponent } from './components/compare-text/compare-text.component';
import { ComparisonTableCdkComponent } from './components/compare-table/comparison-table/comparison-table.component';
import { StatusFooterComponent } from './components/status-footer/status-footer.component';
import { CompareButtonsComponent } from './components/compare-buttons/compare-buttons.component';
import { CompareSettingsModule } from './components/compare-settings/compare-settings.module';
import { AppSharedModule } from './shared/app.shared.module';
import { CompareTableContainerComponent } from './components/compare-table/compare-table-container.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    FileLoaderComponent,
    CompareTextComponent,
    ComparisonTableCdkComponent,
    StatusFooterComponent,
    CompareButtonsComponent,
    CompareTableContainerComponent,
  ],
  imports: [
    AppSharedModule,
    BrowserModule,
    AppRoutingModule,
    CompareSettingsModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient],
      },
    }),
  ],
  providers: [],
  bootstrap: [AppComponent],
})
export class AppModule {}
