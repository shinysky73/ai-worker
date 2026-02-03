export const mockGeminiResponse = {
  slideContent: 'This slide shows...',
  script: 'Welcome to our presentation...',
  estimatedSeconds: 45,
};

export const createGeminiMock = () => ({
  generateContent: jest.fn().mockResolvedValue({
    response: {
      text: () => JSON.stringify(mockGeminiResponse),
    },
  }),
});
