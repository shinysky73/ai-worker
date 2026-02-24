import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useImageToExcelStore } from './imageToExcelStore';

describe('useImageToExcelStore', () => {
  beforeEach(() => {
    const { result } = renderHook(() => useImageToExcelStore());
    act(() => result.current.reset());
  });

  it('shouldHaveDefaultOptions: 기본 타입은 receipt', () => {
    const { result } = renderHook(() => useImageToExcelStore());
    expect(result.current.options.type).toBe('receipt');
  });

  it('shouldSetOptions: 타입 변경', () => {
    const { result } = renderHook(() => useImageToExcelStore());

    act(() => {
      result.current.setOptions({ type: 'namecard' });
    });

    expect(result.current.options.type).toBe('namecard');
  });

  it('shouldReset: reset 시 기본값 복원', () => {
    const { result } = renderHook(() => useImageToExcelStore());

    act(() => {
      result.current.setOptions({ type: 'namecard' });
      result.current.reset();
    });

    expect(result.current.options.type).toBe('receipt');
  });
});
