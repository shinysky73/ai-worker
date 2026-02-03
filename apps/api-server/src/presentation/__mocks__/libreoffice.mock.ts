export const mockLibreOffice = {
  convertToPdf: jest.fn().mockResolvedValue('/tmp/output.pdf'),
  isInstalled: jest.fn().mockResolvedValue(true),
};

export const createLibreOfficeMock = () => ({
  convertToPdf: jest.fn().mockResolvedValue('/tmp/output.pdf'),
  isInstalled: jest.fn().mockResolvedValue(true),
});
