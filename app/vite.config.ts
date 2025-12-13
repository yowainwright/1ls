import { defineConfig } from 'vite'
import { TanStackRouterVite } from '@tanstack/router-plugin/vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import rehypeShiki from '@shikijs/rehype'
import {
  transformerNotationDiff,
  transformerNotationHighlight,
  transformerNotationWordHighlight,
  transformerNotationFocus,
  transformerNotationErrorLevel,
  transformerMetaHighlight,
} from '@shikijs/transformers'
import rehypeSlug from 'rehype-slug'
import remarkGfm from 'remark-gfm'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    TanStackRouterVite({
      target: 'react',
      autoCodeSplitting: true,
    }),
    {
      enforce: 'pre',
      ...mdx({
        providerImportSource: '@mdx-js/react',
        remarkPlugins: [remarkGfm],
        rehypePlugins: [
          rehypeSlug,
          [
            rehypeShiki,
            {
              theme: 'dracula',
              addLanguageClass: true,
              transformers: [
                transformerNotationDiff(),
                transformerNotationHighlight(),
                transformerNotationWordHighlight(),
                transformerNotationFocus(),
                transformerNotationErrorLevel(),
                transformerMetaHighlight(),
              ],
            },
          ],
        ],
      }),
    },
    react({ include: /\.(mdx|js|jsx|ts|tsx)$/ }),
  ],
  base: '/1ls/',
  server: {
    port: 3000 + Math.floor(Math.random() * 1000),
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '1ls/browser': path.resolve(__dirname, '../dist/browser/index.js'),
    },
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  },
})
