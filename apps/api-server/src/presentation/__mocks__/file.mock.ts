import { Readable } from 'stream';

export interface MockFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
  stream?: Readable;
}

export const createMockPptxFile = (
  overrides: Partial<MockFile> = {},
): MockFile => ({
  fieldname: 'file',
  originalname: 'presentation.pptx',
  encoding: '7bit',
  mimetype:
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  size: 1024 * 1024, // 1MB
  buffer: Buffer.from('PK mock pptx content'),
  ...overrides,
});

// PPT OLE2 magic bytes: D0 CF 11 E0 A1 B1 1A E1
const PPT_OLE2_HEADER = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);

export const createMockPptFile = (
  overrides: Partial<MockFile> = {},
): MockFile => ({
  fieldname: 'file',
  originalname: 'presentation.ppt',
  encoding: '7bit',
  mimetype: 'application/vnd.ms-powerpoint',
  size: 1024 * 1024, // 1MB
  buffer: Buffer.concat([PPT_OLE2_HEADER, Buffer.from(' mock ppt content')]),
  ...overrides,
});

export const createMockInvalidFile = (
  overrides: Partial<MockFile> = {},
): MockFile => ({
  fieldname: 'file',
  originalname: 'document.txt',
  encoding: '7bit',
  mimetype: 'text/plain',
  size: 1024 * 1024,
  buffer: Buffer.from('plain text content'),
  ...overrides,
});

export const createMockLargeFile = (sizeInMB: number = 51): MockFile => ({
  fieldname: 'file',
  originalname: 'large-presentation.pptx',
  encoding: '7bit',
  mimetype:
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  size: sizeInMB * 1024 * 1024,
  buffer: Buffer.alloc(100), // Small buffer for testing, size field determines validation
});

export const createMockCorruptedPptxFile = (
  overrides: Partial<MockFile> = {},
): MockFile => ({
  fieldname: 'file',
  originalname: 'corrupted.pptx',
  encoding: '7bit',
  mimetype:
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  size: 1024,
  buffer: Buffer.from('corrupted data - not a valid zip'), // PPTX should start with PK (ZIP signature)
  ...overrides,
});
