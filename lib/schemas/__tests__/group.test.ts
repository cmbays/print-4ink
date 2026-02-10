import { describe, it, expect } from "vitest";
import { groupSchema } from "../group";

describe("groupSchema", () => {
  const validGroup = {
    id: "91a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    name: "Marketing Dept",
    customerId: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
  };

  it("accepts a valid group", () => {
    const result = groupSchema.parse(validGroup);
    expect(result.name).toBe("Marketing Dept");
    expect(result.customerId).toBe("c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c");
  });

  it("rejects empty name", () => {
    expect(() =>
      groupSchema.parse({ ...validGroup, name: "" })
    ).toThrow();
  });

  it("rejects invalid UUID for customerId", () => {
    expect(() =>
      groupSchema.parse({ ...validGroup, customerId: "not-a-uuid" })
    ).toThrow();
  });

  it("rejects invalid UUID for id", () => {
    expect(() =>
      groupSchema.parse({ ...validGroup, id: "not-a-uuid" })
    ).toThrow();
  });
});
