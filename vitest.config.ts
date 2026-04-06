import { defineConfig } from 'vitest/config';
import { transformWithEsbuild } from 'vite';

export default defineConfig({
  plugins: [
    {
      name: 'esbuild-decorators',
      enforce: 'pre',
      async transform(code, id) {
        if (/\.tsx?$/.test(id) && !id.includes('node_modules')) {
          const result = await transformWithEsbuild(code, id, {
            target: 'es2022',
          });
          return { code: result.code, map: result.map };
        }
      },
    },
  ],
  test: {
    include: ['src/**/*.test.ts', 'tests/**/*.test.ts'],
  },
});
