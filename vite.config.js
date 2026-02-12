import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';

export default defineConfig(({ mode }) => ({
  plugins: [
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
    outDir: 'dist/web',
    sourcemap: false,
    minify: true
  }
}));
