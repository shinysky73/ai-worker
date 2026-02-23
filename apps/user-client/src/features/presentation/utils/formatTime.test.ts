import { describe, it, expect } from 'vitest';
import { formatTime } from './formatTime';

describe('formatTime', () => {
  it('should format seconds only', () => {
    expect(formatTime(30)).toBe('30초');
  });

  it('should format zero seconds', () => {
    expect(formatTime(0)).toBe('0초');
  });

  it('should format exact minutes', () => {
    expect(formatTime(60)).toBe('1분');
    expect(formatTime(120)).toBe('2분');
  });

  it('should format minutes and seconds', () => {
    expect(formatTime(90)).toBe('1분 30초');
    expect(formatTime(150)).toBe('2분 30초');
  });
});
