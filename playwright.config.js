import { defineConfig } from '@playwright/test';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: `file://${__dirname}/index.html`,
    headless: false,
  },
});
