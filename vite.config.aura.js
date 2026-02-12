import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';
import svgr from 'vite-plugin-svgr';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Plugin to strip Google Fonts imports from Syncfusion CSS during build
// This prevents CSP violations in Salesforce by removing @import statements
// that load external fonts before any JavaScript can intercept them
const stripGoogleFontsPlugin = () => ({
  name: 'strip-google-fonts',
  transform(code, id) {
    // Only process CSS files from Syncfusion packages
    if (id.includes('@syncfusion') && id.endsWith('.css')) {
      // Remove @import statements that load Google Fonts
      const cleanedCode = code.replace(
        /@import\s+url\s*\(\s*['"]?https?:\/\/fonts\.googleapis\.com[^)]*\)\s*;?/gi,
        '/* Google Fonts import removed for Salesforce CSP compliance */'
      );

      if (cleanedCode !== code) {
        console.log(`[Vite] Stripped Google Fonts from: ${path.basename(id)}`);
      }

      return {
        code: cleanedCode,
        map: null
      };
    }
    return null;
  }
});

export default defineConfig(({ mode }) => ({
  root: __dirname, // Set root to react directory
  plugins: [
    stripGoogleFontsPlugin(), // Must be first to process CSS before bundling
    svgr({
      include: '**/*.svg'
    }),
    react()
  ],
  define: {
    __APPGRID_BUILD_DEBUG__: JSON.stringify(
      mode === 'debug' || process.env.VITE_DEBUG === 'true'
    ),
    __APPGRID_BUILD_ID__: JSON.stringify(
      process.env.APPGRID_BUILD_ID || new Date().toISOString()
    )
  },
  build: {
    // We are targeting a single output file, so we don't need a library-specific config.
    outDir: 'dist/aura',

    // Set minify to true for production to reduce file size.
    minify: true,

    // Disable sourcemaps for the final production build.
    sourcemap: false,

    rollupOptions: {
      input: path.resolve(
        __dirname,
        'src/components/appGridAuraComponent/index.tsx'
      ),
      // Removed external dependencies - React/ReactDOM will be bundled within the application
      // This is necessary because Salesforce LWC doesn't provide React as a global
      output: {
        // This is the key part for creating a global script.
        format: 'iife', // Immediately Invoked Function Expression
        // The name property is removed as we are manually attaching the app to the window object
        // in the entry file (index.tsx) for greater reliability.
        entryFileNames: 'appGridAuraComponent.js'
      }
    }
  }
}));
