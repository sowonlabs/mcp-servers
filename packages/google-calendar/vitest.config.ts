import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.test.ts'],
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      src: '/src',
    },
  },
  plugins: [
    swc.vite({
      jsc: {
        parser: {
          syntax: 'typescript',
          decorators: true,
        },
        target: 'es2018',
        transform: {
          decoratorMetadata: true,
          legacyDecorator: true,
        },
      }
    })
  ],
  optimizeDeps: {
    esbuildOptions: {
      target: 'es2018',
      supported: {
        decorators: true
      }
    }
  }
});