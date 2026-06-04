import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// On GitHub Pages the app is served from /<repo-name>/, so the build needs a
// matching base path. The deploy workflow sets GITHUB_PAGES=true. Everywhere
// else (Vercel/Netlify/local dev) it's served at the root, so base stays '/'.
export default defineConfig({
  plugins: [react()],
  base: process.env.GITHUB_PAGES ? '/friend2friend-prototype/' : '/',
})
