/**
 * Build script for WikiToGrok extension
 * Runs two separate builds:
 * 1. ES modules for service worker, popup, and options
 * 2. IIFE for content script (no imports allowed in content scripts)
 */

import { build } from 'vite';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, existsSync, readdirSync } from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(fileURLToPath(import.meta.url), '..');
const rootDir = resolve(__dirname, '..');

async function copyPublicFiles() {
  const distDir = resolve(rootDir, 'dist');
  const publicDir = resolve(rootDir, 'public');

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
      if (file.endsWith('.png')) {
        copyFileSync(
          resolve(iconsDir, file),
          resolve(distIconsDir, file)
        );
      }
    });
  }

  // Copy popup HTML/CSS
  const popupDir = resolve(rootDir, 'src/popup');
  copyFileSync(
    resolve(popupDir, 'popup.html'),
    resolve(distDir, 'popup.html')
  );
  copyFileSync(
    resolve(popupDir, 'popup.css'),
    resolve(distDir, 'popup.css')
  );

  // Copy options HTML/CSS
  const optionsDir = resolve(rootDir, 'src/options');
  copyFileSync(
    resolve(optionsDir, 'options.html'),
    resolve(distDir, 'options.html')
  );
  copyFileSync(
    resolve(optionsDir, 'options.css'),
    resolve(distDir, 'options.css')
  );
}

async function buildExtension() {
  console.log('Building WikiToGrok extension...\n');

  const isProduction = process.env.NODE_ENV === 'production';

  // Build 1: ES modules for service worker, popup, options
  console.log('Step 1: Building ES modules (service worker, popup, options)...');
  await build({
    configFile: false,
    build: {
      rollupOptions: {
        input: {
          'service-worker': resolve(rootDir, 'src/background/service-worker.ts'),
          'popup': resolve(rootDir, 'src/popup/popup.ts'),
          'options': resolve(rootDir, 'src/options/options.ts'),
        },
        output: {
          entryFileNames: '[name].js',
          chunkFileNames: 'chunks/[name].js',
          assetFileNames: '[name].[ext]',
          dir: resolve(rootDir, 'dist'),
          format: 'es',
        },
      },
      outDir: resolve(rootDir, 'dist'),
      emptyOutDir: true,
      sourcemap: !isProduction,
      minify: isProduction,
    },
  });
  console.log('✓ ES modules built\n');

  // Build 2: IIFE for content script (must be self-contained)
  console.log('Step 2: Building IIFE content script...');
  await build({
    configFile: false,
    build: {
      rollupOptions: {
        input: resolve(rootDir, 'src/content/content-script.ts'),
        output: {
          entryFileNames: 'content-script.js',
          dir: resolve(rootDir, 'dist'),
          format: 'iife',
        },
      },
      outDir: resolve(rootDir, 'dist'),
      emptyOutDir: false,  // Don't clear the ES modules we just built
      sourcemap: false,
      minify: isProduction,
    },
  });
  console.log('✓ Content script built\n');

  // Copy static files
  console.log('Step 3: Copying static files...');
  await copyPublicFiles();
  console.log('✓ Static files copied\n');

  console.log('Build complete! Extension is in the dist/ folder.');
}

buildExtension().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
