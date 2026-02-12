import { describe, it, expect } from "vitest";
import { scratchNoteSchema } from "../scratch-note";

describe("scratchNoteSchema", () => {
  const validNote = {
    id: "5a100001-0000-4000-8000-000000000001",
    content: "John called, 200 black tees with front print, wants by next Friday",
    createdAt: "2026-02-11T09:15:00Z",
    isArchived: false,
  };

  it("validates a valid scratch note", () => {
    const result = scratchNoteSchema.parse(validNote);
    expect(result.content).toBe(validNote.content);
    expect(result.isArchived).toBe(false);
  });

  it("defaults isArchived to false when omitted", () => {
    const { isArchived: _isArchived, ...noArchived } = validNote;
    const result = scratchNoteSchema.parse(noArchived);
    expect(result.isArchived).toBe(false);
  });

  it("accepts archived notes", () => {
    const result = scratchNoteSchema.parse({ ...validNote, isArchived: true });
    expect(result.isArchived).toBe(true);
  });

  it("rejects empty content", () => {
    expect(() =>
      scratchNoteSchema.parse({ ...validNote, content: "" })
    ).toThrow();
  });

  it("rejects invalid UUID", () => {
    expect(() =>
      scratchNoteSchema.parse({ ...validNote, id: "bad-id" })
    ).toThrow();
  });

  it("rejects invalid datetime", () => {
    expect(() =>
      scratchNoteSchema.parse({ ...validNote, createdAt: "not-a-date" })
    ).toThrow();
  });
});
