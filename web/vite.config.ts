import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  base: './',  // fixes relative paths for Firebase hosting
});
