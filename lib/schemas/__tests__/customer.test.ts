import { describe, it, expect } from "vitest";
import { customerSchema, customerTagEnum } from "../customer";

describe("customerTagEnum", () => {
  it.each(["new", "repeat", "contract"])(
    "accepts '%s'",
    (tag) => {
      expect(customerTagEnum.parse(tag)).toBe(tag);
    }
  );

  it("rejects invalid tag", () => {
    expect(() => customerTagEnum.parse("vip")).toThrow();
  });
});

describe("customerSchema", () => {
  const validCustomer = {
    id: "c1a2b3c4-d5e6-4f7a-8b9c-0d1e2f3a4b5c",
    name: "Marcus Rivera",
    company: "River City Brewing Co.",
    email: "marcus@rivercitybrewing.com",
    phone: "(512) 555-0147",
    address: "1200 E 6th St, Austin, TX 78702",
    tag: "repeat" as const,
  };

  it("accepts a valid customer", () => {
    const result = customerSchema.parse(validCustomer);
    expect(result.name).toBe("Marcus Rivera");
    expect(result.tag).toBe("repeat");
  });

  it("defaults tag to 'new' when omitted", () => {
    const withoutTag = { ...validCustomer };
    delete (withoutTag as Record<string, unknown>).tag;
    const result = customerSchema.parse(withoutTag);
    expect(result.tag).toBe("new");
  });

  it("rejects invalid UUID", () => {
    expect(() =>
      customerSchema.parse({ ...validCustomer, id: "not-a-uuid" })
    ).toThrow();
  });

  it("rejects empty name", () => {
    expect(() =>
      customerSchema.parse({ ...validCustomer, name: "" })
    ).toThrow();
  });

  it("rejects empty company", () => {
    expect(() =>
      customerSchema.parse({ ...validCustomer, company: "" })
    ).toThrow();
  });

  it("rejects invalid email", () => {
    expect(() =>
      customerSchema.parse({ ...validCustomer, email: "not-an-email" })
    ).toThrow();
  });

  it("accepts empty phone and address", () => {
    const result = customerSchema.parse({
      ...validCustomer,
      phone: "",
      address: "",
    });
    expect(result.phone).toBe("");
    expect(result.address).toBe("");
  });

  it("accepts all tag values", () => {
    for (const tag of ["new", "repeat", "contract"]) {
      const result = customerSchema.parse({ ...validCustomer, tag });
      expect(result.tag).toBe(tag);
    }
  });

  it("rejects invalid tag", () => {
    expect(() =>
      customerSchema.parse({ ...validCustomer, tag: "premium" })
    ).toThrow();
  });
});
