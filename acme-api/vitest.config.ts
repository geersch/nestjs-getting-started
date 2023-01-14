/// <reference types="vitest" />
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  test: {
    deps: {
      interopDefault: true,
    },
    environment: 'node',
    coverage: {
      reporter: ['text', 'html'],
    },
    reporters: 'default',
    include: ['**/*.spec.{ts,cts}'],
  },
  root: '.',
});
