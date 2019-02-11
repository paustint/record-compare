import { Component, OnInit } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { LogService } from '../../providers/log.service';

const TAB_HEIGHT = 37;
const FOOTER_HEIGHT = 50;
const OTHER_HEIGHT = 50;

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  menuItems: MenuItem[] = [
    { id: 'compareFiles', label: 'Compare Files', icon: 'file-spreadsheet', command: this.changeActiveItem.bind(this) },
    { id: 'compareText', label: 'Compare Text', icon: 'font', command: this.changeActiveItem.bind(this) },
  ];
  activeMenuItem: MenuItem;
  contentHeight = TAB_HEIGHT + FOOTER_HEIGHT + OTHER_HEIGHT;

  constructor(private log: LogService) {}

  ngOnInit() {
    this.activeMenuItem = this.menuItems[0];
  }

  changeActiveItem({ item, originalItem }: { item: MenuItem; originalItem: any }) {
    this.activeMenuItem = item;
  }
}
