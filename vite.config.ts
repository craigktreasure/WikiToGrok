import { defineConfig, build } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync, writeFileSync, readFileSync } from 'fs';

const __dirname = resolve();

/**
 * Copy public files to dist after build
 */
function copyPublicFiles() {
  return {
    name: 'copy-public-files',
    closeBundle() {
      const distDir = resolve(__dirname, 'dist');
      const publicDir = resolve(__dirname, 'public');
      
      // Ensure dist exists
      if (!existsSync(distDir)) {
        mkdirSync(distDir, { recursive: true });
      }
      
      // Copy manifest.json
      copyFileSync(
        resolve(publicDir, 'manifest.json'),
        resolve(distDir, 'manifest.json')
      );
      
      // Copy icons
      const iconsDir = resolve(publicDir, 'icons');
      const distIconsDir = resolve(distDir, 'icons');
      if (existsSync(iconsDir)) {
        if (!existsSync(distIconsDir)) {
          mkdirSync(distIconsDir, { recursive: true });
        }
        readdirSync(iconsDir).forEach(file => {
          copyFileSync(
            resolve(iconsDir, file),
            resolve(distIconsDir, file)
          );
        });
      }
      
      // Copy popup HTML/CSS
      const popupDir = resolve(__dirname, 'src/popup');
      copyFileSync(
        resolve(popupDir, 'popup.html'),
        resolve(distDir, 'popup.html')
      );
      copyFileSync(
        resolve(popupDir, 'popup.css'),
        resolve(distDir, 'popup.css')
      );
      
      // Copy options HTML/CSS
      const optionsDir = resolve(__dirname, 'src/options');
      copyFileSync(
        resolve(optionsDir, 'options.html'),
        resolve(distDir, 'options.html')
      );
      copyFileSync(
        resolve(optionsDir, 'options.css'),
        resolve(distDir, 'options.css')
      );
    }
  };
}

// Build configuration for content script (IIFE - no imports allowed)
const contentScriptConfig = {
  build: {
    rollupOptions: {
      input: resolve(__dirname, 'src/content/content-script.ts'),
      output: {
        entryFileNames: 'content-script.js',
        dir: 'dist',
        format: 'iife' as const,
      },
    },
    outDir: 'dist',
    emptyOutDir: false,
    sourcemap: false,
    minify: true,
    write: true,
  },
};

// Build configuration for ES modules (service worker, popup, options)
const moduleConfig = {
  build: {
    rollupOptions: {
      input: {
        'service-worker': resolve(__dirname, 'src/background/service-worker.ts'),
        'popup': resolve(__dirname, 'src/popup/popup.ts'),
        'options': resolve(__dirname, 'src/options/options.ts'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: 'chunks/[name].js',
        assetFileNames: '[name].[ext]',
        dir: 'dist',
        format: 'es' as const,
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV === 'development',
    minify: process.env.NODE_ENV === 'production',
  },
  plugins: [copyPublicFiles()],
};

export default defineConfig(moduleConfig);

// Export content script config for separate build
export { contentScriptConfig };
