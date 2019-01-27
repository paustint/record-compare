import 'reflect-metadata';
import '../polyfills';
import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { HttpClientModule, HttpClient } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';

import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { TableModule } from 'primeng/table';
import { CheckboxModule } from 'primeng/checkbox';
import { ProgressSpinnerModule } from 'primeng/progressspinner';

import { NgxTextDiffModule } from 'ngx-text-diff';

import { CdkTableModule } from '@angular/cdk/table';
import { ScrollDispatchModule } from '@angular/cdk/scrolling';

// NG Translate
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { ElectronService } from './providers/electron.service';

import { WebviewDirective } from './directives/webview.directive';

import { AppComponent } from './app.component';
import { HomeComponent } from './components/home/home.component';
import { FileLoaderComponent } from './components/file-loader/file-loader.component';
import { CompareMenuComponent } from './components/compare-menu/compare-menu.component';
import { CompareTextComponent } from './components/compare-text/compare-text.component';
import { ComparisonTableCdkComponent } from './components/comparison-table-cdk/comparison-table-cdk.component';
import { HeaderCellSizeDirective } from './directives/header-cell-size.directive';
import { ContainerDirective } from './directives/container.directive';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { StatusFooterComponent } from './components/status-footer/status-footer.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http, './assets/i18n/', '.json');
}

@NgModule({
  declarations: [
    AppComponent,
    HomeComponent,
    WebviewDirective,
    FileLoaderComponent,
    CompareMenuComponent,
    CompareTextComponent,
    ComparisonTableCdkComponent,
    HeaderCellSizeDirective,
    ContainerDirective,
    SafeHtmlPipe,
    StatusFooterComponent,
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    MenubarModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    CheckboxModule,
    NgxTextDiffModule,
    TableModule,
    CdkTableModule,
    ScrollDispatchModule,
    ProgressSpinnerModule,
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
