import { Injectable } from '@angular/core';
import { MappedHeadingItemRow } from '../../../models';
import { SelectItem } from 'primeng/api';

interface NormalizedItems {
  left: {
    [heading: string]: {
      default: string;
      lowercase: string;
      removeSpecial: string;
    };
  };
  right: {
    default: { [item: string]: { item: string; index: number } };
    lowercase: { [item: string]: { item: string; index: number } };
    removeSpecial: { [item: string]: { item: string; index: number } };
  };
}

@Injectable()
export class CompareSettingsMappingService {
  constructor() {}

  autoMap(leftHeaders: string[], rightHeaders: string[]): MappedHeadingItemRow[] {
    const normalizedItems = this.getNormalizedItems(leftHeaders, rightHeaders);
    const options = rightHeaders.map(item => ({ label: item, value: item }));
    return this.matchNormalizedItems(leftHeaders, normalizedItems, options);
  }

  private getNormalizedItems(leftHeaders: string[], rightHeaders: string[]): NormalizedItems {
    const normalizedItems: NormalizedItems = {
      left: {},
      right: {
        default: {},
        lowercase: {},
        removeSpecial: {},
      },
    };
    leftHeaders.forEach(item => {
      normalizedItems.left[item] = {
        default: item.trim(),
        lowercase: item.toLowerCase(),
        removeSpecial: item.replace(/[^\w]/i, ''),
      };
    });
    rightHeaders.forEach((item, i) => {
      normalizedItems.right.default[item.trim()] = { item, index: i };
      normalizedItems.right.lowercase[item.toLowerCase()] = { item, index: i };
      normalizedItems.right.removeSpecial[item.replace(/[^\w]/i, '')] = { item, index: i };
    });
    return normalizedItems;
  }

  private matchNormalizedItems(leftHeaders: string[], normalizedItems: NormalizedItems, options: SelectItem[]): MappedHeadingItemRow[] {
    const rows: MappedHeadingItemRow[] = [];
    leftHeaders.forEach(item => {
      if (normalizedItems.right.default[normalizedItems.left[item].default]) {
        // EXACT MATCH
        const right = normalizedItems.right.default[normalizedItems.left[item].default];
        rows.push({
          left: item,
          right: right.item,
          options,
          autoMatched: true,
          autoMatchedType: 'default',
        });
      } else if (normalizedItems.right.lowercase[normalizedItems.left[item].lowercase]) {
        // LOWERCASE MATCH
        const right = normalizedItems.right.lowercase[normalizedItems.left[item].lowercase];
        rows.push({
          left: item,
          right: right.item,
          options,
          autoMatched: true,
          autoMatchedType: 'lowercase',
        });
      } else if (normalizedItems.right.removeSpecial[normalizedItems.left[item].removeSpecial]) {
        // EXACT MATCH
        const right = normalizedItems.right.lowercase[normalizedItems.left[item].lowercase];
        rows.push({
          left: item,
          right: right.item,
          options,
          autoMatched: true,
          autoMatchedType: 'removeSpecial',
        });
      } else {
        rows.push({
          left: item,
          options,
          autoMatched: false,
        });
      }
    });
    return rows;
  }
}
