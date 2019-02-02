import { ScrollDispatchModule } from '@angular/cdk/scrolling';
import { CdkTableModule } from '@angular/cdk/table';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { NgModule } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NgxTextDiffModule } from 'ngx-text-diff';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DialogModule } from 'primeng/dialog';
import { FieldsetModule } from 'primeng/fieldset';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { ProgressSpinnerModule } from 'primeng/progressspinner';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';
import { ListboxModule } from 'primeng/listbox';
import { ContainerDirective } from './directives/container.directive';
import { HeaderCellSizeDirective } from './directives/header-cell-size.directive';
import { WebviewDirective } from './directives/webview.directive';
import { SafeHtmlPipe } from './pipes/safe-html.pipe';
import { MultiSelectModule } from 'primeng/multiselect';

/**
 * This component imports items (modules/directives/pipes)
 * and re-exports them for use in any other module
 * this avoids needing duplicate imports in various modules
 * for things that will be used all over the application
 */

@NgModule({
  declarations: [WebviewDirective, HeaderCellSizeDirective, ContainerDirective, SafeHtmlPipe],
  imports: [
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
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
    FieldsetModule,
    DialogModule,
    ListboxModule,
    MultiSelectModule,
  ],
  exports: [
    CommonModule,
    BrowserAnimationsModule,
    FormsModule,
    HttpClientModule,
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
    FieldsetModule,
    DialogModule,
    WebviewDirective,
    HeaderCellSizeDirective,
    ContainerDirective,
    SafeHtmlPipe,
    ListboxModule,
    MultiSelectModule,
  ],
})
export class AppSharedModule {}
