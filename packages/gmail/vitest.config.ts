import { defineConfig } from 'vitest/config';
import swc from 'unplugin-swc';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.test' });

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/*.spec.ts', '**/*.test.ts'],
    setupFiles: ['./tests/setup.ts'],
    env: process.env,
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