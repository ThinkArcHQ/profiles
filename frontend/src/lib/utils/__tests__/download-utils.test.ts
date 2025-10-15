import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { downloadFilesAsZip, downloadSingleFile } from '../download-utils';

// Mock JSZip
vi.mock('jszip', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      file: vi.fn().mockReturnThis(),
      generateAsync: vi.fn().mockResolvedValue(new Blob(['test'], { type: 'application/zip' })),
    })),
  };
});

describe('download-utils', () => {
  let createElementSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // Clear all mocks before each test
    vi.clearAllMocks();

    // Mock URL methods
    global.URL.createObjectURL = vi.fn(() => 'blob:mock-url');
    global.URL.revokeObjectURL = vi.fn();

    // Mock DOM methods
    const mockLink = {
      href: '',
      download: '',
      click: vi.fn(),
    } as unknown as HTMLAnchorElement;

    createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(mockLink);
    vi.spyOn(document.body, 'appendChild').mockImplementation(() => mockLink);
    vi.spyOn(document.body, 'removeChild').mockImplementation(() => mockLink);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('downloadFilesAsZip', () => {
    it('should download files as a ZIP archive', async () => {
      const files = [
        { path: 'index.html', content: '<html></html>' },
        { path: 'styles.css', content: 'body { margin: 0; }' },
      ];

      await downloadFilesAsZip(files, 'test.zip');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });

    it('should throw error if no files provided', async () => {
      await expect(downloadFilesAsZip([])).rejects.toThrow('No files to download');
    });
  });

  describe('downloadSingleFile', () => {
    it('should download a single file', () => {
      downloadSingleFile('test.txt', 'Hello World');

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(global.URL.createObjectURL).toHaveBeenCalled();
      expect(global.URL.revokeObjectURL).toHaveBeenCalled();
    });
  });
});
