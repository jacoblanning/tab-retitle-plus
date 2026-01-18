import { defineConfig, build as viteBuild } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Determine if we're in production mode
const isProduction = process.env.NODE_ENV === 'production';

// Build configuration for extension scripts (service worker & content script)
const buildScript = (entry: string, outFile: string) => {
  return viteBuild({
    configFile: false,
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
        '@shared': resolve(__dirname, 'src/shared'),
      },
    },
    build: {
      lib: {
        entry,
        name: outFile,
        formats: ['iife'],
        fileName: () => `${outFile}.js`,
      },
      outDir: 'dist',
      emptyOutDir: false,
      minify: isProduction ? 'esbuild' : false,
      rollupOptions: {
        output: {
          extend: true,
          entryFileNames: `${outFile}.js`,
        },
      },
    },
  });
};

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@shared': resolve(__dirname, 'src/shared'),
    },
  },
  build: {
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'src/popup/popup.html'),
        options: resolve(__dirname, 'src/options/options.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: (assetInfo) => {
          // Keep HTML files at root level, preserve other assets
          if (assetInfo.name?.endsWith('.html')) {
            return '[name][extname]';
          }
          return '[name].[ext]';
        },
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: isProduction ? 'esbuild' : false,
  },
  plugins: [
    react(),
    {
      name: 'move-html-files',
      closeBundle: async () => {
        const fs = await import('fs');
        const path = await import('path');
        const distDir = resolve(__dirname, 'dist');

        // Move popup.html to root and fix paths
        const popupSrc = path.join(distDir, 'src/popup/popup.html');
        const popupDest = path.join(distDir, 'popup.html');
        if (fs.existsSync(popupSrc)) {
          let popupContent = fs.readFileSync(popupSrc, 'utf-8');
          // Replace absolute paths with relative paths
          popupContent = popupContent.replace(/src="\/([^"]+)"/g, 'src="./$1"');
          popupContent = popupContent.replace(/href="\/([^"]+)"/g, 'href="./$1"');
          fs.writeFileSync(popupDest, popupContent);
          fs.unlinkSync(popupSrc);
        }

        // Move options.html to root and fix paths
        const optionsSrc = path.join(distDir, 'src/options/options.html');
        const optionsDest = path.join(distDir, 'options.html');
        if (fs.existsSync(optionsSrc)) {
          let optionsContent = fs.readFileSync(optionsSrc, 'utf-8');
          // Replace absolute paths with relative paths
          optionsContent = optionsContent.replace(/src="\/([^"]+)"/g, 'src="./$1"');
          optionsContent = optionsContent.replace(/href="\/([^"]+)"/g, 'href="./$1"');
          fs.writeFileSync(optionsDest, optionsContent);
          fs.unlinkSync(optionsSrc);
        }

        // Clean up empty directories
        try {
          const popupDir = path.join(distDir, 'src/popup');
          const optionsDir = path.join(distDir, 'src/options');
          const srcDir = path.join(distDir, 'src');
          
          if (fs.existsSync(popupDir) && fs.readdirSync(popupDir).length === 0) {
            fs.rmdirSync(popupDir);
          }
          if (fs.existsSync(optionsDir) && fs.readdirSync(optionsDir).length === 0) {
            fs.rmdirSync(optionsDir);
          }
          if (fs.existsSync(srcDir) && fs.readdirSync(srcDir).length === 0) {
            fs.rmdirSync(srcDir);
          }
        } catch (e) {
          // Ignore errors cleaning up directories
        }
      },
    },
    {
      name: 'build-extension-scripts',
      closeBundle: async () => {
        // Build service worker and content script as IIFE bundles
        await buildScript(
          resolve(__dirname, 'src/background/service-worker.ts'),
          'service-worker'
        );
        await buildScript(
          resolve(__dirname, 'src/content/title-updater.ts'),
          'content-title-updater'
        );

        // Copy public assets
        const fs = await import('fs');
        const path = await import('path');

        // Copy manifest
        fs.copyFileSync(
          resolve(__dirname, 'public/manifest.json'),
          resolve(__dirname, 'dist/manifest.json')
        );

        // Copy theme.js
        fs.copyFileSync(
          resolve(__dirname, 'public/theme.js'),
          resolve(__dirname, 'dist/theme.js')
        );

        // Copy icons directory
        const iconsDir = resolve(__dirname, 'public/icons');
        const distIconsDir = resolve(__dirname, 'dist/icons');

        if (!fs.existsSync(distIconsDir)) {
          fs.mkdirSync(distIconsDir, { recursive: true });
        }

        if (fs.existsSync(iconsDir)) {
          const files = fs.readdirSync(iconsDir);
          files.forEach(file => {
            if (file.endsWith('.png')) {
              fs.copyFileSync(
                path.join(iconsDir, file),
                path.join(distIconsDir, file)
              );
            }
          });
        }
      },
    },
  ],
});
