import swc from 'unplugin-swc';
import { loadEnv } from 'vite';
import { defineConfig } from 'vitest/config';

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [
      swc.vite({
        // Explicitly set the module type to avoid inheriting this value from a `.swcrc` config file
        module: { type: 'es6' },
      }),
    ],
    test: {
      deps: {
        interopDefault: true,
      },
      environment: 'node',
      coverage: {
        provider: 'v8',
        reporter: ['text', 'html'],
      },
      reporters: 'default',
      include: ['**/*.e2e-spec.ts'],
    },
    root: '.',
  };
});
