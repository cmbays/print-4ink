import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow _-prefixed variables for intentional destructured-rest patterns
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          varsIgnorePattern: '^_',
          argsIgnorePattern: '^_',
          destructuredArrayIgnorePattern: '^_',
        },
      ],
      // Pages must use <Topbar breadcrumbs={buildBreadcrumbs(...)}> — not raw Breadcrumb
      // Mock-data modules must only be accessed through infrastructure/repositories/_providers/mock/
      // Interface declarations drift from Zod schemas — use type aliases or z.infer<>
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@shared/ui/primitives/breadcrumb',
              message:
                'Use <Topbar breadcrumbs={buildBreadcrumbs(...)}> instead of raw <Breadcrumb>. See src/shared/lib/breadcrumbs.ts',
            },
          ],
          patterns: [
            {
              regex: '@infra/repositories/_providers',
              message:
                'Import from @infra/repositories/{domain} only. Never import from _providers directly — that layer is infrastructure-internal.',
            },
          ],
        },
      ],
      // Mock data files are at src/infrastructure/repositories/_providers/mock/data*.ts.
      // App layer must import via @infra/repositories/{domain} — never from _providers directly.
      // The no-restricted-imports pattern below enforces this for all src/ consumers.
      // TODO(#404): promote to error once all 145 interface violations are migrated.
      // Use `type` for component props, `z.infer<typeof Schema>` for domain entities.
      '@typescript-eslint/consistent-type-definitions': ['warn', 'type'],
    },
  },
  // Topbar is the only file allowed to import from @shared/ui/primitives/breadcrumb
  {
    files: ['src/shared/ui/layouts/topbar.tsx'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // Infrastructure layer is allowed to import from _providers internally
  {
    files: ['src/infrastructure/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // Test files are allowed to import mock _providers directly for test fixtures
  {
    files: ['**/*.test.ts', '**/*.test.tsx', '**/__tests__/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // MockAdapter is the supplier-layer equivalent of _providers/mock — allowed to import from _providers
  {
    files: ['lib/suppliers/**', 'src/infrastructure/adapters/**'],
    rules: {
      'no-restricted-imports': 'off',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Skill templates are reference scaffolds, not production code
    '.claude/skills/**/templates/**',
    // Knowledge base build artifacts (Astro)
    'knowledge-base/dist/**',
    'knowledge-base/.astro/**',
    // Node.js utility scripts — CommonJS, not part of the Next.js app
    'scripts/**',
  ]),
])

export default eslintConfig
