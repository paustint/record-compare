// tslint:disable:no-console
import * as fs from 'fs-extra';
import * as XLSX from 'xlsx';
import { parse, unparse } from 'papaparse';
import { FileContentsEvent, FileContentsResponse } from './worker-models';
import * as _ from 'lodash';
import { MatchType, MatchRowsItemContent } from '../src/app/models';
import { byteLength } from 'byte-length';

const stripHtmlRegex = /<[^>]+>/g;

export const FILETYPE_REGEX = {
  CSV: /\.csv$/i,
  XLSX: /\.(xls|xlsx)$/i,
};

export function writeContentToCsv(data: any | any[], fields: string[], fileStream: fs.WriteStream, retNumBytes = false): number {
  data = Array.isArray(data) ? data : [data];
  const diffContentCsvRow = unparse({ fields, data }, { header: false, newline: '\n', quotes: true });
  fileStream.write(`${diffContentCsvRow}\n`);
  if (retNumBytes) {
    return byteLength(`${diffContentCsvRow}\n`);
  } else {
    return -1;
  }
}

export function getDiffContent(diffs: [number, string][]): MatchRowsItemContent {
  const output: MatchRowsItemContent = {
    left: '',
    right: '',
    hasDiff: false,
  };
  diffs.forEach(diff => {
    switch (diff[0]) {
      case -1:
        output.left += getMisMatchSpan(diff[1], 'remove');
        output.hasDiff = true;
        break;
      case 1:
        output.right += getMisMatchSpan(diff[1], 'add');
        output.hasDiff = true;
        break;
      default:
        output.left += getMatchSpan(diff[1]);
        output.right += getMatchSpan(diff[1]);
        break;
    }
  });
  return output;
}

export function getMisMatchSpan(val: string, type: MatchType) {
  return `<span class="diff mismatch mismatch-${type}">${val || ''}</span>`;
}

export function getMatchSpan(val: string) {
  return `<span class="diff match">${val || ''}</span>`;
}

export function getMaxStringLength(item1?: string, item2?: string): number {
  try {
    if (!_.isString(item1) && !_.isString(item2)) {
      return 0;
    } else if (_.isString(item1) && _.isString(item2)) {
      return Math.max(item1.length, item2.length);
    } else if (_.isString(item1)) {
      return item1.length;
    } else {
      return item2.length;
    }
  } catch (ex) {
    return 0;
  }
}

export function getValAsString(val: any): string {
  if (_.isString(val)) {
    return val;
  } else if (_.isNil(val) || _.isNaN(val)) {
    return '';
  } else if (_.isNumber(val)) {
    return val.toString();
  } else if (_.isBoolean(val)) {
    return val ? 'TRUE' : 'FALSE';
  } else {
    return JSON.stringify(val);
  }
}

export async function parseFile(fileData: FileContentsEvent): Promise<FileContentsResponse> {
  const { type, filename } = fileData;
  let fileContents: string | Buffer;

  console.time('read file');
  if (type === 'csv') {
    fileContents = await fs.readFile(filename, 'utf-8');
  } else if (type === 'xlsx') {
    fileContents = await fs.readFile(filename);
  } else {
    fileContents = await fs.readFile(filename, 'utf-8');
  }
  console.timeEnd('read file');

  if (type === 'csv') {
    // CSV
    console.time('parse csv');
    const parseResults = parse(fileContents as string, { skipEmptyLines: true, header: true });
    console.timeEnd('parse csv');

    if (parseResults.errors.length > 0) {
      console.log('Errors parsing file', parseResults.errors);
      const errorMessage = parseResults.errors.reduce((message: string, curr) => {
        if (message.length < 250) {
          message += `\nRow ${curr.row}: ${curr.message}. `;
        } else if (!message.endsWith('...')) {
          message += ' ...';
        }
        return message;
      }, '');
      throw new Error(errorMessage);
    } else {
      console.log(parseResults.data);
      return {
        type: 'csv',
        headers: parseResults.meta.fields,
        data: parseResults.data,
      };
    }
  } else if (type === 'xlsx') {
    // XLSX
    console.time('parse xlsx');
    const workbook = XLSX.read(fileContents, { type: 'buffer' });
    console.timeEnd('parse xlsx');

    console.time('convert xlsx to json');
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(worksheet, { defval: '', raw: true });
    const headers = Object.keys(data[0]);
    console.timeEnd('convert xlsx to json');

    return {
      type: 'xlsx',
      headers,
      data,
    };
  } else {
    // TEXT
    return {
      type: 'text',
      data: fileContents as string,
    };
  }
}

export function stripHtml(val: string): string {
  val = val || '';
  return val.replace(stripHtmlRegex, '');
}
