import { describe, it, expect, beforeEach } from 'vitest';
import { useImageAnalysisStore } from './imageAnalysisStore';

describe('imageAnalysisStore', () => {
  beforeEach(() => {
    useImageAnalysisStore.getState().reset();
  });

  // FR-2 AC3: 기본값 확인
  it('shouldHaveDefaultOptions: 기본값 detailLevel=detailed, language=ko', () => {
    const { options } = useImageAnalysisStore.getState();
    expect(options.detailLevel).toBe('detailed');
    expect(options.language).toBe('ko');
  });

  // FR-2 AC1: 설명 수준 변경
  it('shouldUpdateDetailLevel: 설명 수준 변경', () => {
    useImageAnalysisStore.getState().setOptions({ detailLevel: 'brief' });
    const { options } = useImageAnalysisStore.getState();
    expect(options.detailLevel).toBe('brief');
    expect(options.language).toBe('ko'); // 다른 옵션 유지
  });

  // FR-2 AC2: 출력 언어 변경
  it('shouldUpdateLanguage: 출력 언어 변경', () => {
    useImageAnalysisStore.getState().setOptions({ language: 'en' });
    const { options } = useImageAnalysisStore.getState();
    expect(options.language).toBe('en');
    expect(options.detailLevel).toBe('detailed'); // 다른 옵션 유지
  });

  it('shouldResetToDefaults: reset 시 기본값으로 복원', () => {
    useImageAnalysisStore.getState().setOptions({ detailLevel: 'brief', language: 'en' });

    useImageAnalysisStore.getState().reset();
    const { options } = useImageAnalysisStore.getState();
    expect(options.detailLevel).toBe('detailed');
    expect(options.language).toBe('ko');
  });
});
