/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import basicSsl from '@vitejs/plugin-basic-ssl'


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    basicSsl(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
  }
})
