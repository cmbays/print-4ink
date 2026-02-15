import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scrollToFirstError } from "../scroll-to-error";

describe("scrollToFirstError", () => {
  let originalRAF: typeof globalThis.requestAnimationFrame;
  let originalDocument: typeof globalThis.document;

  beforeEach(() => {
    originalRAF = globalThis.requestAnimationFrame;
    originalDocument = globalThis.document;

    // Mock rAF to execute synchronously
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    };
  });

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRAF;
    globalThis.document = originalDocument;
    vi.restoreAllMocks();
  });

  it("calls scrollIntoView on first element with role=alert", () => {
    const mockScrollIntoView = vi.fn();
    const mockElement = { scrollIntoView: mockScrollIntoView };
    const mockQuerySelector = vi.fn().mockReturnValue(mockElement);

    globalThis.document = { querySelector: mockQuerySelector } as unknown as Document;

    scrollToFirstError();

    expect(mockQuerySelector).toHaveBeenCalledWith('[role="alert"]');
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: "smooth",
      block: "center",
    });
  });

  it("does nothing when no error element is found", () => {
    const mockQuerySelector = vi.fn().mockReturnValue(null);

    globalThis.document = { querySelector: mockQuerySelector } as unknown as Document;

    // Should not throw
    scrollToFirstError();

    expect(mockQuerySelector).toHaveBeenCalledWith('[role="alert"]');
  });
});
