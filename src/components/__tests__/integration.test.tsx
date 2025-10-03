/**
 * Integration tests for QueryEditor with all extensions
 */

import React from "react";
import { render, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, vi } from 'vitest';
import { QueryEditor } from "../QueryEditor";
import { ColumnDef, DataType } from "../../types/column";

// Mock columns
const columns: ColumnDef[] = [
  { id: "status", name: "status", type: DataType.STRING },
  { id: "priority", name: "priority", type: DataType.STRING },
  { id: "assignee", name: "assignee", type: DataType.STRING },
  { id: "count", name: "count", type: DataType.NUMBER },
  { id: "score", name: "score", type: DataType.NUMBER },
  { id: "active", name: "active", type: DataType.BOOLEAN },
  { id: "completed", name: "completed", type: DataType.BOOLEAN },
];

// No CSS modules to mock anymore - using Tailwind classes

describe("QueryEditor Integration", () => {
  describe("Syntax Highlighting", () => {
    it("should apply syntax highlighting classes", async () => {
      const { container } = render(
        <QueryEditor
          value="[status] = 'open' AND [count] > 5"
          columns={columns}
        />
      );

      await waitFor(() => {
        // Check for highlighting spans
        const highlights = container.querySelectorAll('[class*="cm-query-"]');
        expect(highlights.length).toBeGreaterThan(0);
      });
    });

    it("should highlight different token types", async () => {
      const { container } = render(
        <QueryEditor
          value="[status] = 'open' AND [active] = true OR ([count] > 10)"
          columns={columns}
        />
      );

      await waitFor(() => {
        // Check for different token type classes
        expect(
          container.querySelector('[class*="cm-query-field"]')
        ).toBeInTheDocument();
        expect(
          container.querySelector('[class*="cm-query-string"]')
        ).toBeInTheDocument();
        expect(
          container.querySelector('[class*="cm-query-keyword"]')
        ).toBeInTheDocument();
        expect(
          container.querySelector('[class*="cm-query-boolean"]')
        ).toBeInTheDocument();
        expect(
          container.querySelector('[class*="cm-query-number"]')
        ).toBeInTheDocument();
        expect(
          container.querySelector('[class*="cm-query-bracket"]')
        ).toBeInTheDocument();
      });
    });
  });

  describe("Validation", () => {
    it("should show error decorations for invalid fields", async () => {
      const { container } = render(
        <QueryEditor value="[invalid_field] = 'value'" columns={columns} />
      );

      await waitFor(() => {
        const errorMarks = container.querySelectorAll(".cm-query-error");
        expect(errorMarks.length).toBeGreaterThan(0);
      });
    });

    it("should show lint markers for errors", async () => {
      const { container } = render(
        <QueryEditor value="[unknown] = 'test'" columns={columns} />
      );

      await waitFor(
        () => {
          const lintMarkers = container.querySelectorAll(
            ".cm-lint-marker-error"
          );
          expect(lintMarkers.length).toBeGreaterThan(0);
        },
        { timeout: 3000 }
      );
    });

    it("should clear errors when query becomes valid", async () => {
      const { container, rerender } = render(
        <QueryEditor value="[invalid] = 'value'" columns={columns} />
      );

      // Wait for error decorations
      await waitFor(() => {
        expect(container.querySelector(".cm-query-error")).toBeInTheDocument();
      });

      // Update to valid query
      rerender(<QueryEditor value="[status] = 'open'" columns={columns} />);

      // Errors should be cleared
      await waitFor(() => {
        expect(
          container.querySelector(".cm-query-error")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Auto-formatting", () => {
    it("should format on blur", async () => {
      const onChange = vi.fn();
      const { container } = render(
        <QueryEditor
          value="[status]='open' and[count]>5"
          columns={columns}
          onChange={onChange}
        />
      );

      const editor = container.querySelector(".cm-content") as HTMLElement;

      // Focus and blur to trigger formatting
      fireEvent.focus(editor);
      fireEvent.blur(editor);

      await waitFor(
        () => {
          const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
          // Should be formatted with proper spacing
          expect(lastCall[0].text).toContain("AND");
          expect(lastCall[0].text).toContain(" > ");
        },
        { timeout: 3000 }
      );
    });

    it("should format with keyboard shortcut", async () => {
      const onChange = vi.fn();
      const { container } = render(
        <QueryEditor
          value="[status]='open'and[count]>5"
          columns={columns}
          onChange={onChange}
        />
      );

      const editor = container.querySelector(".cm-content") as HTMLElement;

      // Trigger format shortcut (Cmd/Ctrl + Shift + F)
      fireEvent.keyDown(editor, {
        key: "f",
        code: "KeyF",
        ctrlKey: true,
        shiftKey: true,
      });

      await waitFor(() => {
        const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
        // Should be formatted
        expect(lastCall[0].text).toContain(" AND ");
      });
    });

    it("should maintain idempotence when formatting", async () => {
      const formatted = "[status] = 'open' AND [count] > 5";
      const onChange = vi.fn();

      const { container } = render(
        <QueryEditor value={formatted} columns={columns} onChange={onChange} />
      );

      const editor = container.querySelector(".cm-content") as HTMLElement;

      // Format already formatted text
      fireEvent.focus(editor);
      fireEvent.blur(editor);

      await waitFor(() => {
        // Should not change if already formatted
        const calls = onChange.mock.calls;
        if (calls.length > 0) {
          const lastCall = calls[calls.length - 1];
          expect(lastCall[0].text).toBe(formatted);
        }
      });
    });
  });

  describe("Theme support", () => {
    it("should apply light theme styles", () => {
      const { container } = render(
        <QueryEditor
          value="[status] = 'open'"
          columns={columns}
          theme="light"
        />
      );

      expect(
        container.querySelector(".query-editor--light")
      ).toBeInTheDocument();
    });

    it("should apply dark theme styles", () => {
      const { container } = render(
        <QueryEditor value="[status] = 'open'" columns={columns} theme="dark" />
      );

      expect(
        container.querySelector(".query-editor--dark")
      ).toBeInTheDocument();
    });

    it("should update theme dynamically", async () => {
      const { container, rerender } = render(
        <QueryEditor
          value="[status] = 'open'"
          columns={columns}
          theme="light"
        />
      );

      expect(
        container.querySelector(".query-editor--light")
      ).toBeInTheDocument();

      rerender(
        <QueryEditor value="[status] = 'open'" columns={columns} theme="dark" />
      );

      await waitFor(() => {
        expect(
          container.querySelector(".query-editor--dark")
        ).toBeInTheDocument();
        expect(
          container.querySelector(".query-editor--light")
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Complex queries", () => {
    it("should handle nested groups", async () => {
      const onChange = vi.fn();
      const query =
        "([status] = 'open' OR [status] = 'pending') AND ([priority] = 'high' OR [priority] = 'critical')";

      const { container } = render(
        <QueryEditor value={query} columns={columns} onChange={onChange} />
      );

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            text: query,
            isValid: true,
            filters: expect.objectContaining({
              type: "group",
              operator: "AND",
            }),
          })
        );
      });
    });

    it("should handle all operators", async () => {
      const queries = [
        "[status] = 'open'",
        "[status] != 'closed'",
        "[count] > 10",
        "[count] < 100",
        "[count] >= 10",
        "[count] <= 100",
        "[status] CONTAINS 'pen'",
        "[status] STARTS WITH 'op'",
        "[status] ENDS WITH 'en'",
        "[status] IS BLANK",
        "[active] = true",
        "[active] = false",
      ];

      for (const query of queries) {
        const onChange = vi.fn();

        const { unmount } = render(
          <QueryEditor value={query} columns={columns} onChange={onChange} />
        );

        await waitFor(() => {
          const lastCall = onChange.mock.calls[onChange.mock.calls.length - 1];
          expect(lastCall[0].isValid).toBe(true);
        });

        unmount();
      }
    });

    it("should handle mixed logical operators", async () => {
      const onChange = vi.fn();
      const query =
        "[status] = 'open' AND [priority] = 'high' OR [assignee] = 'john' AND NOT [completed] = true";

      const { container } = render(
        <QueryEditor value={query} columns={columns} onChange={onChange} />
      );

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            text: query,
            isValid: true,
          })
        );
      });
    });
  });

  describe("Edge cases", () => {
    it("should handle empty input", async () => {
      const onChange = vi.fn();

      const { container } = render(
        <QueryEditor value="" columns={columns} onChange={onChange} />
      );

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            text: "",
            isValid: false,
          })
        );
      });
    });

    it("should handle whitespace-only input", async () => {
      const onChange = vi.fn();

      const { container } = render(
        <QueryEditor value="   " columns={columns} onChange={onChange} />
      );

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            text: "   ",
            isValid: false,
          })
        );
      });
    });

    it("should handle very long queries", async () => {
      const longQuery = Array(50)
        .fill(null)
        .map((_, i) => `[status] = 'value${i}'`)
        .join(" OR ");

      const onChange = vi.fn();

      const { container } = render(
        <QueryEditor value={longQuery} columns={columns} onChange={onChange} />
      );

      await waitFor(() => {
        expect(onChange).toHaveBeenCalledWith(
          expect.objectContaining({
            text: longQuery,
            isValid: true,
          })
        );
      });
    });

    it("should handle special characters in strings", async () => {
      const queries = [
        "[status] = 'it\\'s working'",
        '[status] = "with \\"quotes\\""',
        "[status] = 'with\\nnewline'",
        "[status] = 'with\\ttab'",
      ];

      for (const query of queries) {
        const onChange = vi.fn();

        const { unmount } = render(
          <QueryEditor value={query} columns={columns} onChange={onChange} />
        );

        await waitFor(() => {
          expect(onChange).toHaveBeenCalled();
        });

        unmount();
      }
    });
  });
});
