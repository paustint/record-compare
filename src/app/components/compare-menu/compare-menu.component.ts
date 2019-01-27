import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';

@Component({
  selector: 'app-compare-menu',
  templateUrl: './compare-menu.component.html',
  styleUrls: ['./compare-menu.component.scss'],
})
export class CompareMenuComponent implements OnInit {
  items: MenuItem[];

  constructor() {}

  ngOnInit() {
    this.items = [
      {
        label: 'File',
        items: [
          {
            label: 'New',
            icon: 'pi pi-fw pi-plus',
            items: [{ label: 'Project' }, { label: 'Other' }],
          },
          { label: 'Open' },
          { label: 'Quit' },
        ],
      },
      {
        label: 'Edit',
        icon: 'pi pi-fw pi-pencil',
        items: [{ label: 'Delete', icon: 'pi pi-fw pi-trash' }, { label: 'Refresh', icon: 'pi pi-fw pi-refresh' }],
      },
    ];
  }
}
