import { describe, it, expect } from "vitest";
import { noteSchema, noteChannelEnum, noteEntityTypeEnum } from "../note";

describe("noteChannelEnum", () => {
  it.each(["phone", "email", "text", "social", "in-person"])(
    "accepts '%s'",
    (channel) => {
      expect(noteChannelEnum.parse(channel)).toBe(channel);
    }
  );

  it("rejects invalid channel", () => {
    expect(() => noteChannelEnum.parse("slack")).toThrow();
  });
});

describe("noteEntityTypeEnum", () => {
  it.each(["customer", "quote", "artwork", "job", "invoice", "credit_memo"])(
    "accepts '%s'",
    (type) => {
      expect(noteEntityTypeEnum.parse(type)).toBe(type);
    }
  );

  it("rejects invalid entity type", () => {
    expect(() => noteEntityTypeEnum.parse("order")).toThrow();
  });
});

describe("noteSchema", () => {
  const validNote = {
    id: "61a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    content: "Customer prefers black garments.",
    createdAt: "2026-02-01T10:00:00Z",
    createdBy: "Gary",
    isPinned: true,
    channel: "phone" as const,
    entityType: "customer" as const,
    entityId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  };

  it("accepts a valid note", () => {
    const result = noteSchema.parse(validNote);
    expect(result.content).toBe("Customer prefers black garments.");
    expect(result.isPinned).toBe(true);
    expect(result.channel).toBe("phone");
  });

  it("accepts null channel", () => {
    const withNullChannel = { ...validNote, channel: null };
    const result = noteSchema.parse(withNullChannel);
    expect(result.channel).toBeNull();
  });

  it("defaults channel to null", () => {
    const noChannel = { ...validNote };
    delete (noChannel as Record<string, unknown>).channel;
    const result = noteSchema.parse(noChannel);
    expect(result.channel).toBeNull();
  });

  it("defaults isPinned to false", () => {
    const noPinned = { ...validNote };
    delete (noPinned as Record<string, unknown>).isPinned;
    const result = noteSchema.parse(noPinned);
    expect(result.isPinned).toBe(false);
  });

  it("rejects empty content", () => {
    expect(() =>
      noteSchema.parse({ ...validNote, content: "" })
    ).toThrow();
  });

  it("rejects invalid datetime", () => {
    expect(() =>
      noteSchema.parse({ ...validNote, createdAt: "not-a-date" })
    ).toThrow();
  });

  it("rejects invalid entityType", () => {
    expect(() =>
      noteSchema.parse({ ...validNote, entityType: "order" })
    ).toThrow();
  });

  it("rejects invalid entityId UUID", () => {
    expect(() =>
      noteSchema.parse({ ...validNote, entityId: "not-a-uuid" })
    ).toThrow();
  });
});
