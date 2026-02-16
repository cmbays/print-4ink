import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow _-prefixed variables for intentional destructured-rest patterns
      "@typescript-eslint/no-unused-vars": ["warn", {
        varsIgnorePattern: "^_",
        argsIgnorePattern: "^_",
        destructuredArrayIgnorePattern: "^_",
      }],
      // Pages must use <Topbar breadcrumbs={buildBreadcrumbs(...)}> — not raw Breadcrumb
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@/components/ui/breadcrumb",
          message: "Use <Topbar breadcrumbs={buildBreadcrumbs(...)}> instead of raw <Breadcrumb>. See lib/helpers/breadcrumbs.ts",
        }],
      }],
    },
  },
  // Topbar is the only file allowed to import from @/components/ui/breadcrumb
  {
    files: ["components/layout/topbar.tsx"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
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
