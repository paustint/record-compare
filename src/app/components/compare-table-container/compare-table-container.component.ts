import { Component, OnInit, Input } from '@angular/core';
import { ComparisonService } from '../../providers/comparison.service';
import { ComparisonRow, Pagination, MatchRowsOutput } from '../../models';

@Component({
  selector: 'app-compare-table-container',
  templateUrl: './compare-table-container.component.html',
  styleUrls: ['./compare-table-container.component.scss'],
})
export class CompareTableContainerComponent implements OnInit {
  @Input() contentHeight: number;

  compareResults: MatchRowsOutput;
  headers: string[];
  rows: ComparisonRow[];
  pagination: Pagination;

  constructor(private comparisonService: ComparisonService) {
    this.comparisonService.headers$.subscribe(headers => (this.headers = headers));
    this.comparisonService.rows$.subscribe(rows => {
      this.compareResults = this.comparisonService.currentCompareResults;
      this.rows = rows;
    });
    this.comparisonService.pagination$.subscribe(pagination => (this.pagination = pagination));
  }

  ngOnInit() {}

  paginate(ev: { first: number; rows: number; page: number; pageCount: number }) {
    if (ev.page !== this.pagination.page) {
      this.comparisonService.changePage(ev.page);
    }
    if (ev.rows !== this.pagination.pageSize) {
      this.comparisonService.changePageSize(ev.rows);
    }
  }
}
