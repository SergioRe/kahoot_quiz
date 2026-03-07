import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  esbuild: {
    jsxInject: "import React from 'react'",
  },
  server: {
    host: 'localhost',
    port: 3000,
    strictPort: true,
  },
})
