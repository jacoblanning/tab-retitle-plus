import { defineConfig, build as viteBuild } from 'vite';
import { resolve } from 'path';

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
      minify: false,
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
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
    minify: false,
  },
  plugins: [
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
