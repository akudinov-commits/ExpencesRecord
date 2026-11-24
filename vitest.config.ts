import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    projects: [
      { test: { name: 'web', environment: 'jsdom', include: ['apps/web/test/**/*.test.tsx'], setupFiles: ['apps/web/test/setup.ts'] } },
      { test: { name: 'api', environment: 'node', include: ['apps/api/test/**/*.test.ts'] } },
      { test: { name: 'tooling', environment: 'node', include: ['tests/**/*.test.ts'], exclude: ['tests/**/fixtures/**'], testTimeout: 30000 } },
    ],
  },
});
