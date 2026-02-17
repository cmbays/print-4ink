import { describe, it, expect, vi, beforeEach } from "vitest";
import { prFactsSchema } from "@domain/entities/review-pipeline";

// ---------------------------------------------------------------------------
// Mock child_process — intercept execFileSync calls
// ---------------------------------------------------------------------------

const mockExecFileSync = vi.fn();

vi.mock("child_process", () => ({
  execFileSync: (...args: unknown[]) => mockExecFileSync(...args),
}));

// Import after mocking so the module picks up the mock
import { normalize } from "../normalize";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a mock that returns different output per git command pattern. */
function setupGitMocks(opts: {
  numstat?: string;
  nameStatus?: string;
  log?: string;
  diff?: string;
}) {
  mockExecFileSync.mockImplementation((_cmd: string, args: string[]) => {
    if (args.includes("--numstat")) return opts.numstat ?? "";
    if (args.includes("--name-status")) return opts.nameStatus ?? "";
    if (args[0] === "log") return opts.log ?? "";
    // Plain diff (no --numstat or --name-status flags)
    if (args[0] === "diff") return opts.diff ?? "";
    return "";
  });
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("normalize (Stage 1 — git diff to PRFacts)", () => {
  beforeEach(() => {
    mockExecFileSync.mockReset();
  });

  // -------------------------------------------------------------------------
  // 1. Simple diff with added and modified files
  // -------------------------------------------------------------------------
  it("parses a simple diff with added and modified files", () => {
    setupGitMocks({
      numstat: [
        "10\t2\tlib/review/normalize.ts",
        "5\t3\tlib/schemas/review-pipeline.ts",
      ].join("\n"),
      nameStatus: [
        "A\tlib/review/normalize.ts",
        "M\tlib/schemas/review-pipeline.ts",
      ].join("\n"),
      log: [
        "abc1234\x00feat: add normalize stage\x00Alice",
        "def5678\x00fix: schema tweak\x00Bob",
      ].join("\n"),
      diff: "diff --git a/lib/review/normalize.ts b/lib/review/normalize.ts\n...",
    });

    const result = normalize("feature/test", "main");

    // Validate against Zod schema
    const parsed = prFactsSchema.parse(result);

    expect(parsed.branch).toBe("feature/test");
    expect(parsed.baseBranch).toBe("main");
    expect(parsed.files).toHaveLength(2);

    const addedFile = parsed.files.find(
      (f) => f.path === "lib/review/normalize.ts",
    );
    expect(addedFile).toEqual({
      path: "lib/review/normalize.ts",
      additions: 10,
      deletions: 2,
      status: "added",
    });

    const modifiedFile = parsed.files.find(
      (f) => f.path === "lib/schemas/review-pipeline.ts",
    );
    expect(modifiedFile).toEqual({
      path: "lib/schemas/review-pipeline.ts",
      additions: 5,
      deletions: 3,
      status: "modified",
    });

    expect(parsed.totalAdditions).toBe(15);
    expect(parsed.totalDeletions).toBe(5);
    expect(parsed.commits).toHaveLength(2);
    expect(parsed.commits[0]).toEqual({
      sha: "abc1234",
      message: "feat: add normalize stage",
      author: "Alice",
    });
    expect(parsed.diffContent).toBeDefined();
  });

  // -------------------------------------------------------------------------
  // 2. Binary files (- in numstat) parsed as 0 additions/deletions
  // -------------------------------------------------------------------------
  it("handles binary files (- in numstat) as 0 additions/deletions", () => {
    setupGitMocks({
      numstat: [
        "-\t-\tpublic/logo.png",
        "3\t1\tREADME.md",
      ].join("\n"),
      nameStatus: [
        "A\tpublic/logo.png",
        "M\tREADME.md",
      ].join("\n"),
      log: "aaa1111\x00feat: add logo\x00Alice",
    });

    const result = normalize("feature/binary", "main");
    const parsed = prFactsSchema.parse(result);

    const binaryFile = parsed.files.find((f) => f.path === "public/logo.png");
    expect(binaryFile).toEqual({
      path: "public/logo.png",
      additions: 0,
      deletions: 0,
      status: "added",
    });

    // Totals should only count the text file
    expect(parsed.totalAdditions).toBe(3);
    expect(parsed.totalDeletions).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 3. Renamed files from --name-status -M
  // -------------------------------------------------------------------------
  it("handles renamed files from --name-status -M", () => {
    setupGitMocks({
      numstat: [
        "2\t1\tlib/{old-name.ts => new-name.ts}",
      ].join("\n"),
      nameStatus: [
        "R100\tlib/old-name.ts\tlib/new-name.ts",
      ].join("\n"),
      log: "bbb2222\x00refactor: rename module\x00Bob",
    });

    const result = normalize("feature/rename", "main");
    const parsed = prFactsSchema.parse(result);

    expect(parsed.files).toHaveLength(1);
    expect(parsed.files[0]).toEqual({
      path: "lib/new-name.ts",
      additions: 2,
      deletions: 1,
      status: "renamed",
    });

    expect(parsed.totalAdditions).toBe(2);
    expect(parsed.totalDeletions).toBe(1);
  });

  // -------------------------------------------------------------------------
  // 4. Empty diff (no changes)
  // -------------------------------------------------------------------------
  it("handles empty diff (no changes)", () => {
    setupGitMocks({
      numstat: "",
      nameStatus: "",
      log: "",
      diff: "",
    });

    const result = normalize("feature/empty", "main");
    const parsed = prFactsSchema.parse(result);

    expect(parsed.branch).toBe("feature/empty");
    expect(parsed.baseBranch).toBe("main");
    expect(parsed.files).toHaveLength(0);
    expect(parsed.totalAdditions).toBe(0);
    expect(parsed.totalDeletions).toBe(0);
    expect(parsed.commits).toHaveLength(0);
    expect(parsed.diffContent).toBeUndefined();
  });

  // -------------------------------------------------------------------------
  // 5. Deleted files
  // -------------------------------------------------------------------------
  it("handles deleted files", () => {
    setupGitMocks({
      numstat: [
        "0\t50\tlib/deprecated.ts",
        "0\t30\tlib/old-utils.ts",
      ].join("\n"),
      nameStatus: [
        "D\tlib/deprecated.ts",
        "D\tlib/old-utils.ts",
      ].join("\n"),
      log: "ccc3333\x00chore: remove deprecated code\x00Charlie",
    });

    const result = normalize("feature/cleanup", "main");
    const parsed = prFactsSchema.parse(result);

    expect(parsed.files).toHaveLength(2);
    expect(parsed.files[0]).toEqual({
      path: "lib/deprecated.ts",
      additions: 0,
      deletions: 50,
      status: "deleted",
    });
    expect(parsed.files[1]).toEqual({
      path: "lib/old-utils.ts",
      additions: 0,
      deletions: 30,
      status: "deleted",
    });

    expect(parsed.totalAdditions).toBe(0);
    expect(parsed.totalDeletions).toBe(80);
  });

  // -------------------------------------------------------------------------
  // 6. Git command failure wraps error with sanitized message
  // -------------------------------------------------------------------------
  it("wraps git command failures with a sanitized error message", () => {
    mockExecFileSync.mockImplementation(() => {
      throw new Error("fatal: bad revision 'main...feature/broken'");
    });

    expect(() => normalize("feature/broken", "main")).toThrow(
      "normalize: git commands failed for range main...feature/broken",
    );
  });
});
