import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { scrollToFirstError } from '../scroll-to-error'

describe('scrollToFirstError', () => {
  let originalRAF: typeof globalThis.requestAnimationFrame
  let originalDocument: typeof globalThis.document
  let originalWindow: typeof globalThis.window

  beforeEach(() => {
    originalRAF = globalThis.requestAnimationFrame
    originalDocument = globalThis.document
    originalWindow = globalThis.window

    // Mock rAF to execute synchronously
    globalThis.requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0)
      return 0
    }

    // Mock window.matchMedia (no reduced motion by default)
    globalThis.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: false }),
    } as unknown as Window & typeof globalThis
  })

  afterEach(() => {
    globalThis.requestAnimationFrame = originalRAF
    globalThis.document = originalDocument
    globalThis.window = originalWindow
    vi.restoreAllMocks()
  })

  it('calls scrollIntoView on first element with role=alert', () => {
    const mockScrollIntoView = vi.fn()
    const mockElement = { scrollIntoView: mockScrollIntoView }
    const mockQuerySelector = vi.fn().mockReturnValue(mockElement)

    globalThis.document = { querySelector: mockQuerySelector } as unknown as Document

    scrollToFirstError()

    expect(mockQuerySelector).toHaveBeenCalledWith('[role="alert"]')
    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'smooth',
      block: 'center',
    })
  })

  it('uses auto scroll behavior when prefers-reduced-motion is set', () => {
    const mockScrollIntoView = vi.fn()
    const mockElement = { scrollIntoView: mockScrollIntoView }
    const mockQuerySelector = vi.fn().mockReturnValue(mockElement)

    globalThis.document = { querySelector: mockQuerySelector } as unknown as Document
    globalThis.window = {
      matchMedia: vi.fn().mockReturnValue({ matches: true }),
    } as unknown as Window & typeof globalThis

    scrollToFirstError()

    expect(mockScrollIntoView).toHaveBeenCalledWith({
      behavior: 'auto',
      block: 'center',
    })
  })

  it('does nothing when no error element is found', () => {
    const mockQuerySelector = vi.fn().mockReturnValue(null)

    globalThis.document = { querySelector: mockQuerySelector } as unknown as Document

    // Should not throw
    scrollToFirstError()

    expect(mockQuerySelector).toHaveBeenCalledWith('[role="alert"]')
  })
})
