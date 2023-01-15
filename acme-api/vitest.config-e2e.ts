import { defineConfig, loadEnv } from 'vite';
import swc from 'unplugin-swc';

export default defineConfig(({ mode }) => {
  Object.assign(process.env, loadEnv(mode, process.cwd(), ''));

  return {
    plugins: [swc.vite(), swc.rollup()],
    test: {
      deps: {
        interopDefault: true,
      },
      environment: 'node',
      coverage: {
        reporter: ['text', 'html'],
      },
      reporters: 'default',
      include: ['**/*.e2e-spec.ts'],
    },
    root: '.',
  };
});
