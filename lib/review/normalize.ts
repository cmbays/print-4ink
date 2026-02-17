import { execSync } from "child_process";
import type { PRFacts, FileChange, CommitInfo } from "@/lib/schemas/review-pipeline";

// ---------------------------------------------------------------------------
// Stage 1: Normalize — Extract immutable PR facts from git diff
//
// Shells out to git to collect line counts, file statuses, commit metadata,
// and the raw unified diff. All downstream stages consume the PRFacts output.
//
// Security: branch names are internal pipeline data (CI-controlled), not
// user input. execSync is safe in this context.
// ---------------------------------------------------------------------------

type FileStatus = FileChange["status"];

/** Map git name-status letter codes to FileChange status values. */
const STATUS_MAP: Record<string, FileStatus> = {
  A: "added",
  M: "modified",
  D: "deleted",
  // R (rename) is handled separately since it includes a similarity percentage
};

/**
 * Parse `git diff --numstat` output into a map of path -> { additions, deletions }.
 *
 * Normal lines:  `10\t2\tpath/to/file.ts`
 * Binary lines:  `-\t-\tpath/to/binary.png`
 * Rename lines:  `2\t1\tlib/{old.ts => new.ts}` or `{old => new}/file.ts`
 */
function parseNumstat(raw: string): Map<string, { additions: number; deletions: number }> {
  const map = new Map<string, { additions: number; deletions: number }>();
  if (!raw.trim()) return map;

  for (const line of raw.trim().split("\n")) {
    const parts = line.split("\t");
    if (parts.length < 3) continue;

    const [addStr, delStr, ...pathParts] = parts;
    const rawPath = pathParts.join("\t"); // rejoin in case path has tabs (unlikely but safe)

    // Binary files show `-` for both counts
    const additions = addStr === "-" ? 0 : parseInt(addStr, 10);
    const deletions = delStr === "-" ? 0 : parseInt(delStr, 10);

    map.set(rawPath, { additions, deletions });
  }

  return map;
}

/**
 * Parse `git diff --name-status -M` output into a map of resolved path -> status.
 *
 * Normal:  `A\tpath/to/file.ts`
 * Rename:  `R100\told-path.ts\tnew-path.ts`
 */
function parseNameStatus(raw: string): Map<string, { status: FileStatus; oldPath?: string }> {
  const map = new Map<string, { status: FileStatus; oldPath?: string }>();
  if (!raw.trim()) return map;

  for (const line of raw.trim().split("\n")) {
    const parts = line.split("\t");
    if (parts.length < 2) continue;

    const statusCode = parts[0];

    if (statusCode.startsWith("R")) {
      // Rename: R100\told-path\tnew-path
      const oldPath = parts[1];
      const newPath = parts[2];
      if (newPath) {
        map.set(newPath, { status: "renamed", oldPath });
      }
    } else {
      const mappedStatus = STATUS_MAP[statusCode];
      if (mappedStatus) {
        map.set(parts[1], { status: mappedStatus });
      }
    }
  }

  return map;
}

/**
 * Parse `git log --format='%H%x00%s%x00%an'` output into CommitInfo[].
 */
function parseLog(raw: string): CommitInfo[] {
  if (!raw.trim()) return [];

  return raw
    .trim()
    .split("\n")
    .map((line) => {
      const [sha, message, author] = line.split("\x00");
      return { sha, message, author };
    })
    .filter((c) => c.sha && c.message && c.author);
}

/**
 * Resolve numstat rename paths like `lib/{old.ts => new.ts}` to the new path.
 *
 * Patterns:
 * - `prefix/{old => new}/suffix`  -> `prefix/new/suffix`
 * - `{old => new}`                -> `new`
 */
function resolveRenamePath(numstatPath: string): string {
  const match = numstatPath.match(/^(.*?)\{.*? => (.*?)\}(.*)$/);
  if (!match) return numstatPath;

  const [, prefix, newPart, suffix] = match;
  // Clean up double slashes that can occur when prefix/suffix are empty
  return (prefix + newPart + suffix).replace(/\/\//g, "/");
}

/**
 * Extract immutable PR facts from the current branch's git diff.
 *
 * @param branch - The feature branch name
 * @param baseBranch - The base branch to diff against (e.g., "main")
 * @returns PRFacts conforming to prFactsSchema
 */
export function normalize(branch: string, baseBranch: string): PRFacts {
  const range = `${baseBranch}...${branch}`;

  // Shell out to git for raw data
  const numstatRaw = execSync(`git diff --numstat ${range}`, { encoding: "utf-8" });
  const nameStatusRaw = execSync(`git diff --name-status -M ${range}`, { encoding: "utf-8" });
  const logRaw = execSync(`git log --format='%H%x00%s%x00%an' ${range}`, { encoding: "utf-8" });
  const diffRaw = execSync(`git diff ${range}`, { encoding: "utf-8" });

  // Parse raw outputs
  const numstatMap = parseNumstat(numstatRaw);
  const statusMap = parseNameStatus(nameStatusRaw);
  const commits = parseLog(logRaw);

  // Build file list by merging numstat counts with name-status classifications.
  // Use statusMap as the authoritative file list since it has resolved paths.
  const files: FileChange[] = [];

  // Build a lookup from numstat rename paths to their resolved new paths
  const numstatResolvedMap = new Map<string, { additions: number; deletions: number }>();
  for (const [rawPath, counts] of numstatMap) {
    const resolvedPath = resolveRenamePath(rawPath);
    numstatResolvedMap.set(resolvedPath, counts);
  }

  for (const [filePath, { status }] of statusMap) {
    // Look up counts: first try exact match, then resolved rename path
    const counts = numstatResolvedMap.get(filePath) ??
      numstatMap.get(filePath) ??
      { additions: 0, deletions: 0 };

    files.push({
      path: filePath,
      additions: counts.additions,
      deletions: counts.deletions,
      status,
    });
  }

  // Compute totals
  const totalAdditions = files.reduce((sum, f) => sum + f.additions, 0);
  const totalDeletions = files.reduce((sum, f) => sum + f.deletions, 0);

  // diffContent is optional — only include if non-empty
  const diffContent = diffRaw.trim() || undefined;

  return {
    branch,
    baseBranch,
    files,
    totalAdditions,
    totalDeletions,
    commits,
    diffContent,
  };
}
