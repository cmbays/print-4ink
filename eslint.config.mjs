import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Skill templates are reference scaffolds, not production code
    ".claude/skills/**/templates/**",
    // Knowledge base build artifacts (Astro)
    "knowledge-base/dist/**",
    "knowledge-base/.astro/**",
  ]),
]);

export default eslintConfig;
