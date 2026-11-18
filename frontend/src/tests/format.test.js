import { expect, test } from 'vitest';
import {
  formatStatus,
  fromDateTimeLocal,
  toDateTimeLocal,
} from '../utils/format';

test('formats status names for display', () => {
  expect(formatStatus('sold out')).toBe('Sold Out');
  expect(formatStatus('')).toBe('Unknown');
});

test('converts between the date input format and ISO dates', () => {
  const iso = fromDateTimeLocal('2026-11-19T18:30');
  expect(iso).toMatch(/Z$/);
  expect(toDateTimeLocal(iso)).toBe('2026-11-19T18:30');
});
