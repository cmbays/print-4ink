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
      // Mock-data modules must only be accessed through the DAL (lib/dal/)
      // Interface declarations drift from Zod schemas — use type aliases or z.infer<>
      "no-restricted-imports": ["error", {
        paths: [
          {
            name: "@/components/ui/breadcrumb",
            message: "Use <Topbar breadcrumbs={buildBreadcrumbs(...)}> instead of raw <Breadcrumb>. See lib/helpers/breadcrumbs.ts",
          },
        ],
      }],
      // TODO(#403): promote to error once all 33 mock-data violations are migrated to DAL.
      // Use @/lib/dal/{domain} instead of importing mock-data modules directly.
      "no-restricted-syntax": ["warn",
        {
          selector: "ImportDeclaration[source.value='@/lib/mock-data']",
          message: "Import from @/lib/dal/{domain} instead of mock-data directly. See lib/dal/. Track: #403",
        },
        {
          selector: "ImportDeclaration[source.value='@/lib/mock-data-pricing']",
          message: "Import from @/lib/dal/{domain} instead of mock-data-pricing directly. See lib/dal/. Track: #403",
        },
      ],
      // TODO(#404): promote to error once all 145 interface violations are migrated.
      // Use `type` for component props, `z.infer<typeof Schema>` for domain entities.
      "@typescript-eslint/consistent-type-definitions": ["warn", "type"],
    },
  },
  // Topbar is the only file allowed to import from @/components/ui/breadcrumb
  {
    files: ["components/layout/topbar.tsx"],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // DAL providers are the canonical consumers of mock-data modules
  {
    files: ["lib/dal/**"],
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
    // Node.js utility scripts — CommonJS, not part of the Next.js app
    "scripts/**",
  ]),
]);

export default eslintConfig;
