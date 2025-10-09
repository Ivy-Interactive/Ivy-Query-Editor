/**
 * Test suite for QueryEditor component
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { QueryEditor } from '../QueryEditor';
import { ColumnDef, DataType } from '../../types/column';

// Mock columns for testing
const mockColumns: ColumnDef[] = [
  { name: 'status', type: DataType.STRING, width: 100 },
  { name: 'priority', type: DataType.STRING, width: 100 },
  { name: 'count', type: DataType.NUMBER, width: 100 },
  { name: 'active', type: DataType.BOOLEAN, width: 100 },
];

// No CSS modules to mock anymore - using Tailwind classes

describe('QueryEditor', () => {
  describe('Rendering', () => {
    it('should render without crashing', () => {
      const { container } = render(
        <QueryEditor value="" columns={mockColumns} />
      );
      expect(container.querySelector('.query-editor')).toBeInTheDocument();
    });

    it('should display initial value', () => {
      const { container } = render(
        <QueryEditor value="[status] = 'open'" columns={mockColumns} />
      );
      expect(container.textContent).toContain("[status] = 'open'");
    });

    it('should display placeholder when empty', () => {
      const { container } = render(
        <QueryEditor
          value=""
          columns={mockColumns}
          placeholder="Enter a query..."
        />
      );
      expect(container.textContent).toContain('Enter a query...');
    });

    it('should apply theme class', () => {
      const { container } = render(
        <QueryEditor value="" columns={mockColumns} theme="dark" />
      );
      expect(container.querySelector('.query-editor--dark')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <QueryEditor
          value=""
          columns={mockColumns}
          className="custom-class"
        />
      );
      expect(container.querySelector('.custom-class')).toBeInTheDocument();
    });

    it('should set height style', () => {
      const { container } = render(
        <QueryEditor value="" columns={mockColumns} height={100} />
      );
      const editor = container.querySelector('.query-editor') as HTMLElement;
      expect(editor.style.height).toBe('100px');
    });

    it('should accept string height', () => {
      const { container } = render(
        <QueryEditor value="" columns={mockColumns} height="10rem" />
      );
      const editor = container.querySelector('.query-editor') as HTMLElement;
      expect(editor.style.height).toBe('10rem');
    });
  });

  describe('Controlled behavior', () => {
    it('should call onChange when text changes', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <QueryEditor
          value=""
          columns={mockColumns}
          onChange={onChange}
        />
      );

      // Find the contenteditable element
      const editor = container.querySelector('.cm-content') as HTMLElement;

      // Simulate typing
      fireEvent.focus(editor);
      fireEvent.input(editor, {
        target: { textContent: '[status]' }
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
      });
    });

    it('should update when value prop changes', async () => {
      const { container, rerender } = render(
        <QueryEditor value="[status] = 'open'" columns={mockColumns} />
      );

      expect(container.textContent).toContain("[status] = 'open'");

      rerender(
        <QueryEditor value="[priority] = 'high'" columns={mockColumns} />
      );

      await waitFor(() => {
        expect(container.textContent).toContain("[priority] = 'high'");
        expect(container.textContent).not.toContain("[status] = 'open'");
      });
    });

    it('should respect readOnly prop', () => {
      const onChange = vi.fn();
      const { container } = render(
        <QueryEditor
          value="[status] = 'open'"
          columns={mockColumns}
          onChange={onChange}
          readOnly
        />
      );

      const editor = container.querySelector('.cm-content') as HTMLElement;
      expect(editor.getAttribute('contenteditable')).toBe('false');
    });
  });

  describe('onChange event', () => {
    it('should provide text in onChange event', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <QueryEditor
          value=""
          columns={mockColumns}
          onChange={onChange}
        />
      );

      const editor = container.querySelector('.cm-content') as HTMLElement;

      fireEvent.focus(editor);
      fireEvent.input(editor, {
        target: { textContent: '[status] = "open"' }
      });

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            text: expect.stringContaining('status'),
          })
        );
      });
    });

    it('should provide isValid=true for valid queries', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <QueryEditor
          value=""
          columns={mockColumns}
          onChange={onChange}
        />
      );

      const editor = container.querySelector('.cm-content') as HTMLElement;

      fireEvent.focus(editor);
      fireEvent.input(editor, {
        target: { textContent: '[status] = "open"' }
      });

      await waitFor(() => {
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0].isValid).toBe(true);
      });
    });

    it('should provide isValid=false for invalid queries', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <QueryEditor
          value=""
          columns={mockColumns}
          onChange={onChange}
        />
      );

      const editor = container.querySelector('.cm-content') as HTMLElement;

      fireEvent.focus(editor);
      fireEvent.input(editor, {
        target: { textContent: '[invalid_field] = "value"' }
      });

      await waitFor(() => {
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0].isValid).toBe(false);
      });
    });

    it('should provide errors for invalid queries', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <QueryEditor
          value=""
          columns={mockColumns}
          onChange={onChange}
        />
      );

      const editor = container.querySelector('.cm-content') as HTMLElement;

      fireEvent.focus(editor);
      fireEvent.input(editor, {
        target: { textContent: '[unknown] = "value"' }
      });

      await waitFor(() => {
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0].errors).toBeDefined();
        expect(lastCall[0].errors.length).toBeGreaterThan(0);
      });
    });

    it('should provide filters for valid queries', async () => {
      const onChange = vi.fn();
      const { container } = render(
        <QueryEditor
          value=""
          columns={mockColumns}
          onChange={onChange}
        />
      );

      const editor = container.querySelector('.cm-content') as HTMLElement;

      fireEvent.focus(editor);
      fireEvent.input(editor, {
        target: { textContent: '[status] = "open"' }
      });

      await waitFor(() => {
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0].filters).toBeDefined();
        expect(lastCall[0].filters.type).toBe('group');
      });
    });
  });

  describe('Auto-focus', () => {
    it('should focus editor when autoFocus is true', () => {
      const { container } = render(
        <QueryEditor
          value=""
          columns={mockColumns}
          autoFocus
        />
      );

      const editor = container.querySelector('.cm-content') as HTMLElement;

      // CodeMirror focuses asynchronously
      waitFor(() => {
        expect(document.activeElement).toContain(editor);
      });
    });

    it('should not focus editor when autoFocus is false', () => {
      const { container } = render(
        <QueryEditor
          value=""
          columns={mockColumns}
          autoFocus={false}
        />
      );

      const editor = container.querySelector('.cm-content') as HTMLElement;
      expect(document.activeElement).not.toContain(editor);
    });
  });

  describe('Column updates', () => {
    it('should re-validate when columns change', async () => {
      const onChange = vi.fn();
      const { rerender } = render(
        <QueryEditor
          value="[newField] = 'value'"
          columns={mockColumns}
          onChange={onChange}
        />
      );

      // Initially invalid
      await waitFor(() => {
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0].isValid).toBe(false);
      });

      // Add the new field to columns
      const newColumns = [
        ...mockColumns,
        { name: 'newField', type: DataType.STRING }
      ];

      onChange.mockClear();

      rerender(
        <QueryEditor
          value="[newField] = 'value'"
          columns={newColumns}
          onChange={onChange}
        />
      );

      // Now valid
      await waitFor(() => {
        expect(onChange).toHaveBeenCalled();
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        expect(lastCall[0].isValid).toBe(true);
      });
    });
  });
});