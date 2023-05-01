/// <reference types="vitest" />
import swc from 'unplugin-swc';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [swc.vite()],
    test: {
      deps: {
        interopDefault: true,
      },
      environment: 'node',
      coverage: {
        provider: 'c8',
        reporter: ['text', 'html'],
      },
      reporters: 'default',
      include: ['**/*.e2e-spec.ts'],
    },
    root: '.',
  };
});
