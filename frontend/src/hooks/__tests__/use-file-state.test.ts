import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileState } from '../use-file-state';

describe('useFileState', () => {
  it('should initialize with empty state', () => {
    const { result } = renderHook(() => useFileState());
    const [state] = result.current;

    expect(state.files).toEqual([]);
    expect(state.activeFile).toBeNull();
    expect(state.generatingFiles.size).toBe(0);
  });

  it('should add a new file', () => {
    const { result } = renderHook(() => useFileState());
    const [, actions] = result.current;

    act(() => {
      actions.addFile({
        path: 'index.html',
        content: '<h1>Hello</h1>',
        language: 'html',
      });
    });

    const [state] = result.current;
    expect(state.files).toHaveLength(1);
    expect(state.files[0].path).toBe('index.html');
    expect(state.activeFile).toBe('index.html');
  });

  it('should update an existing file', () => {
    const { result } = renderHook(() => useFileState());
    const [, actions] = result.current;

    act(() => {
      actions.addFile({
        path: 'index.html',
        content: '<h1>Hello</h1>',
        language: 'html',
      });
    });

    act(() => {
      actions.updateFile('index.html', '<h1>Updated</h1>', true);
    });

    const [state] = result.current;
    expect(state.files[0].content).toBe('<h1>Updated</h1>');
    expect(state.files[0].isGenerating).toBe(false);
  });

  it('should track generating files', () => {
    const { result } = renderHook(() => useFileState());
    const [, actions] = result.current;

    act(() => {
      actions.addFile({
        path: 'index.html',
        content: '<h1>Hello</h1>',
        language: 'html',
        isGenerating: true,
      });
    });

    const [state] = result.current;
    expect(state.generatingFiles.has('index.html')).toBe(true);
  });

  it('should mark file as complete', () => {
    const { result } = renderHook(() => useFileState());
    const [, actions] = result.current;

    act(() => {
      actions.addFile({
        path: 'index.html',
        content: '<h1>Hello</h1>',
        language: 'html',
        isGenerating: true,
      });
    });

    act(() => {
      actions.markFileComplete('index.html');
    });

    const [state] = result.current;
    expect(state.files[0].isGenerating).toBe(false);
    expect(state.generatingFiles.has('index.html')).toBe(false);
  });

  it('should mark all files as complete', () => {
    const { result } = renderHook(() => useFileState());
    const [, actions] = result.current;

    act(() => {
      actions.addFile({
        path: 'index.html',
        content: '<h1>Hello</h1>',
        language: 'html',
        isGenerating: true,
      });
      actions.addFile({
        path: 'styles.css',
        content: 'body {}',
        language: 'css',
        isGenerating: true,
      });
    });

    act(() => {
      actions.markAllFilesComplete();
    });

    const [state] = result.current;
    expect(state.files.every(f => !f.isGenerating)).toBe(true);
    expect(state.generatingFiles.size).toBe(0);
  });

  it('should set active file', () => {
    const { result } = renderHook(() => useFileState());
    const [, actions] = result.current;

    act(() => {
      actions.addFile({
        path: 'index.html',
        content: '<h1>Hello</h1>',
        language: 'html',
      });
      actions.addFile({
        path: 'styles.css',
        content: 'body {}',
        language: 'css',
      });
    });

    act(() => {
      actions.setActiveFile('styles.css');
    });

    const [state] = result.current;
    expect(state.activeFile).toBe('styles.css');
  });

  it('should clear all files', () => {
    const { result } = renderHook(() => useFileState());
    const [, actions] = result.current;

    act(() => {
      actions.addFile({
        path: 'index.html',
        content: '<h1>Hello</h1>',
        language: 'html',
      });
    });

    act(() => {
      actions.clearFiles();
    });

    const [state] = result.current;
    expect(state.files).toEqual([]);
    expect(state.activeFile).toBeNull();
    expect(state.generatingFiles.size).toBe(0);
  });

  it('should get a file by path', () => {
    const { result } = renderHook(() => useFileState());

    act(() => {
      const [, actions] = result.current;
      actions.addFile({
        path: 'index.html',
        content: '<h1>Hello</h1>',
        language: 'html',
      });
    });

    const [, actions] = result.current;
    const file = actions.getFile('index.html');
    expect(file).toBeDefined();
    expect(file?.path).toBe('index.html');
  });

  it('should return undefined for non-existent file', () => {
    const { result } = renderHook(() => useFileState());
    const [, actions] = result.current;

    const file = actions.getFile('non-existent.html');
    expect(file).toBeUndefined();
  });
});
