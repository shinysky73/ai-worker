import { describe, it, expect, beforeEach } from 'vitest';
import { usePresentationStore } from './presentationStore';

describe('presentationStore', () => {
  beforeEach(() => {
    usePresentationStore.getState().reset();
  });

  describe('file storage', () => {
    it('shouldStoreUploadedFile: 업로드된 파일 정보 저장', () => {
      const store = usePresentationStore.getState();
      const mockFile = {
        id: 'test-uuid',
        filename: 'presentation.pptx',
      };

      store.setUploadedFile(mockFile);

      const state = usePresentationStore.getState();
      expect(state.uploadedFile).toEqual(mockFile);
    });
  });

  describe('options storage', () => {
    it('shouldStoreOptions: 옵션 (tone, targetMinutes) 저장', () => {
      const store = usePresentationStore.getState();
      const options = {
        tone: 'formal' as const,
        targetMinutes: 15,
      };

      store.setOptions(options);

      const state = usePresentationStore.getState();
      expect(state.options).toEqual(options);
      expect(state.options.tone).toBe('formal');
      expect(state.options.targetMinutes).toBe(15);
    });
  });

  describe('reset', () => {
    it('shouldResetState: 상태 초기화', () => {
      const store = usePresentationStore.getState();

      // Set some state
      store.setUploadedFile({ id: 'test', filename: 'test.pptx' });
      store.setOptions({ tone: 'casual', targetMinutes: 10 });

      // Verify state is set
      let state = usePresentationStore.getState();
      expect(state.uploadedFile).not.toBeNull();
      expect(state.options.tone).toBe('casual');

      // Reset
      store.reset();

      // Verify state is reset
      state = usePresentationStore.getState();
      expect(state.uploadedFile).toBeNull();
      expect(state.options).toEqual({});
    });
  });
});
