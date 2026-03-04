import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['src/**/*.test.js'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.js'],
      exclude: ['src/index.js', 'src/lib/seed.js'],
    },
    // Isolate each test file
    isolate: true,
    // Load env for tests
    env: {
      NODE_ENV: 'test',
      JWT_SECRET: 'test-jwt-secret-makteb',
      JWT_REFRESH_SECRET: 'test-refresh-secret-makteb',
      DATABASE_URL: 'postgresql://makteb:makteb_dev@localhost:5432/makteb',
    },
  },
});
