import * as jsPDF from 'jspdf';
import * as Excel from 'exceljs';
import * as fs from 'fs-extra';
import { parse } from 'papaparse';
import { ComparisonRow, ComparisonRowItem } from '../../src/app/models';
import * as _ from 'lodash';
import { stripHtml } from '../worker-utils';
import * as cheerio from 'cheerio';

interface StyleFontColor {
  RED: string;
  GREEN: string;
  BLACK: string;
}

interface StyleFillColor {
  RED: string;
  GREEN: string;
}

interface Styles {
  FONT: { [P in keyof StyleFontColor]: Partial<Excel.Font> };
  FILL: { [P in keyof StyleFillColor]: Excel.Fill };
}

const STYLES: Styles = {
  FONT: {
    RED: {
      name: 'Calibri (Body)',
      color: {
        argb: '9C0006',
      },
    },
    GREEN: {
      name: 'Calibri (Body)',
      color: {
        argb: '006100',
      },
    },
    BLACK: {
      color: {
        argb: '000000',
      },
    },
  },
  FILL: {
    RED: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFC7CE' },
    },
    GREEN: {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'C6EFCE' },
    },
  },
};

/**
 *
 * Convert compared rows to XLXS
 *
 *
 * @param comparedRowsFileName
 */
export function exportComparisonTableToXlsx(comparedRowsFileName: string) {
  const workbook = new Excel.Workbook();
  workbook.creator = 'Me';
  workbook.lastModifiedBy = 'Her';
  workbook.created = new Date(1985, 8, 30);
  workbook.modified = new Date();
  workbook.lastPrinted = new Date(2016, 9, 27);

  const sheet = workbook.addWorksheet('My Sheet', { properties: { tabColor: { argb: 'FFC0000' } } });
}

export class ExportComparisonTableToXlsx {
  private comparisonRows: ComparisonRow[];
  private headers: string[];
  private workbook: Excel.Workbook;
  private leftSheet: Excel.Worksheet;
  private rightSheet: Excel.Worksheet;
  private combinedSheet: Excel.Worksheet;

  private isInit = false;

  constructor(private comparedRowsFileName: string, private outputFilename: string) {}

  /**
   * Creates a new workbook and saves the file to the provided path
   */
  public async generateExport() {
    if (!this.isInit) {
      await this.init();
    }
    this.comparisonRows.forEach(row => {
      this.convertRowToCells(row.hasDiffs, row.leftIndex, row.left, this.headers.length, this.leftSheet);
      this.convertRowToCells(row.hasDiffs, row.rightIndex, row.right, this.headers.length, this.rightSheet);
      this.combineRows();
    });
    try {
      await this.workbook.xlsx.writeFile(this.outputFilename);
      console.log('[ExportComparisonTableToXlsx] Saved workbook', this.outputFilename);
    } catch (ex) {
      console.log('[ExportComparisonTableToXlsx] Error writing workbook', ex);
    }
  }

  private async init() {
    try {
      await this.parseFile();
      this.initWorkbook();
    } catch (ex) {
      console.log('[ExportComparisonTableToXlsx] Exception', ex);
    }
  }

  private async parseFile() {
    const fileContents = await fs.readFile(this.comparedRowsFileName, 'utf-8');
    const parseResults = parse(fileContents as string, {
      skipEmptyLines: true,
      header: true,
      transform: this.transformCompareCsv.bind(this),
    });
    console.log('parseResults', parseResults);

    if (parseResults.errors.length > 0) {
      // TODO: handle errors!
      console.log('parseResults has errors', parseResults.errors);
    }
    this.comparisonRows = parseResults.data;
    if (this.comparisonRows.length > 0) {
      this.headers = Object.keys(this.comparisonRows[0].left);
    }
  }

  private initWorkbook() {
    this.workbook = new Excel.Workbook();
    this.leftSheet = this.workbook.addWorksheet('Left', { properties: { tabColor: { argb: 'FFC0000' } } });
    this.rightSheet = this.workbook.addWorksheet('Right', { properties: { tabColor: { argb: 'FFC0000' } } });
    this.combinedSheet = this.workbook.addWorksheet('Combined', { properties: { tabColor: { argb: 'FFC0000' } } });

    // configure combined worksheet columns
    this.combinedSheet.columns = [
      { header: 'HAS DIFF', key: 'leftDiff', width: 10, style: { font: { bold: true } } },
      { header: 'ROW', key: 'leftRow', width: 10, style: { font: { bold: true } } },
      ...this.headers.map(header => ({ header: header, key: `${header}1`, width: 10 })),
      { header: 'separator', key: 'separator', width: 10 },
      { header: 'HAS DIFF', key: 'leftDiff', width: 10, style: { font: { bold: true } } },
      { header: 'ROW', key: 'rightRow', width: 10, style: { font: { bold: true } } },
      ...this.headers.map(header => ({ header: header, key: `${header}2`, width: 10 })),
    ];
    this.combinedSheet.autoFilter = {
      from: 'A1',
      to: { row: 1, column: this.combinedSheet.columnCount },
    };
    this.combinedSheet.views = [{ state: 'frozen', xSplit: 0, ySplit: 1 }];

    // Configure left worksheet columns
    this.leftSheet.columns = [
      { header: 'HAS DIFF', key: 'diff', width: 10, style: { font: { bold: true } } },
      { header: 'ROW', key: 'row', width: 10, style: { font: { bold: true } } },
    ].concat(this.headers.map(header => ({ header: header, key: header, width: 10, style: { font: { bold: false } } })));
    this.leftSheet.autoFilter = {
      from: 'A1',
      to: { row: 1, column: this.leftSheet.columnCount },
    };
    this.leftSheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 1 }];

    // Configure right worksheet columns
    this.rightSheet.columns = [
      { header: 'HAS DIFF', key: 'diff', width: 10, style: { font: { bold: true } } },
      { header: 'ROW', key: 'row', width: 10, style: { font: { bold: true } } },
    ].concat(this.headers.map(header => ({ header: header, key: header, width: 10, style: { font: { bold: false } } })));
    this.rightSheet.autoFilter = {
      from: 'A1',
      to: { row: 1, column: this.rightSheet.columnCount },
    };
    this.rightSheet.views = [{ state: 'frozen', xSplit: 2, ySplit: 1 }];
  }

  private convertRowToCells(
    hasDiffs: boolean,
    rowIndex: number,
    comparisonRowItem: ComparisonRowItem,
    headerCount: number,
    worksheet: Excel.Worksheet
  ) {
    let rowRichText: Excel.RichText[][] = [];

    let rowValues: (string | number | boolean)[] = Object.keys(comparisonRowItem).map(key => {
      const value = comparisonRowItem[key];
      const $ = cheerio.load(value.content as string);
      const richText: Excel.RichText[] = [];

      $('span').each((i, elem) => {
        const cheerioElem = $(elem);
        const mismatch = cheerioElem.hasClass('mismatch');
        richText.push({
          font: mismatch ? STYLES.FONT.RED : STYLES.FONT.BLACK,
          text: cheerioElem.text(),
        });
      });
      rowRichText.push(richText);
      return stripHtml(value.content as string);
    });

    if (rowValues.length === 0) {
      rowValues = new Array(headerCount).fill('');
      rowRichText = new Array(headerCount).fill([]);
    }

    rowValues.unshift(rowIndex ? rowIndex : '');
    rowValues.unshift(hasDiffs);

    const currRow: Excel.Row = worksheet.addRow(rowValues);

    currRow.eachCell({ includeEmpty: true }, (cell: Excel.Cell, colNumber: number) => {
      if (colNumber === 1) {
        // If mismatch = false, mark as green
        // If mismatch = true, mark as red
        cell.style = {
          // fill: cell.value ? STYLES.FILL.GREEN : STYLES.FILL.RED,
          fill: cell.value ? STYLES.FILL.RED : STYLES.FILL.GREEN,
          font: cell.value ? STYLES.FONT.RED : STYLES.FONT.GREEN,
        };
      } else if (colNumber === 2) {
        cell.style = { font: { bold: false } };
      } else {
        // col numbes start at 1 and the first column is a number, not in the rich text array, so we skip adding
        const currIndex = colNumber - 3;
        const richText = rowRichText[currIndex];
        cell.value = { richText };
        if (richText.length > 1 || (richText.length > 0 && richText[0].font.bold)) {
          cell.style = {
            fill: STYLES.FILL.RED,
          };
        }
      }
    });
  }

  private combineRows() {
    for (let i = 0; i < this.leftSheet.rowCount; i++) {
      const combinedRow = this.combinedSheet.getRow(i + 1);
      let currCell = 1;
      this.leftSheet.getRow(i + 1).eachCell({ includeEmpty: true }, cell => {
        combinedRow.getCell(currCell).value = _.cloneDeep(cell.value);
        combinedRow.getCell(currCell).style = _.cloneDeep(cell.style);
        currCell++;
      });
      combinedRow.getCell(currCell).value = '';
      currCell++;
      this.rightSheet.getRow(i + 1).eachCell({ includeEmpty: true }, cell => {
        combinedRow.getCell(currCell).value = _.cloneDeep(cell.value);
        combinedRow.getCell(currCell).style = _.cloneDeep(cell.style);
        currCell++;
      });
      this.combinedSheet.addRow(combinedRow);
    }
  }

  private transformCompareCsv(value: string, field: string | number) {
    try {
      switch (field) {
        case 'hasDiffs': {
          return value.startsWith('t') ? true : false;
        }
        case 'key': {
          return value;
        }
        case 'leftIndex': {
          return Number(value);
        }
        case 'rightIndex': {
          return Number(value);
        }
        case 'left': {
          if (value.startsWith('{')) {
            return JSON.parse(value);
          }
          return {};
        }
        case 'right': {
          if (value.startsWith('{')) {
            return JSON.parse(value);
          }
          return {};
        }
        default:
          return value;
      }
    } catch (ex) {
      console.log('Error transforming', field, value);
      console.log(ex);
      return value;
    }
  }
}
