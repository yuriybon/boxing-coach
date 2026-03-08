import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig, loadEnv} from 'vite';

export default defineConfig(({mode, command}) => {
  const env = loadEnv(mode, '.', '');
  const isDev = command === 'serve'
  const isProd = command === 'build'
  return {
    plugins: [      
      react(), 
      tailwindcss()
    ],
    define: {
      'process.env.MODE': JSON.stringify(mode),
      'process.env.DEV': isDev,
      'process.env.PROD': isProd
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@components': path.resolve(__dirname, './src/components'),
        '@hooks': path.resolve(__dirname, './src/hooks'),
        '@lib': path.resolve(__dirname, './src/lib'),
        '@wasm': path.resolve(__dirname, './src/wasm'),
        '@assembly': path.resolve(__dirname, './src/assembly')
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json', '.wasm']
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      port: 5173,
      host: true,
      open: true,
      
      // HMR configuration (respects AI Studio settings)
      hmr: process.env.DISABLE_HMR !== 'true' ? {
        host: 'localhost',
        port: 5173,
        protocol: 'ws'
      } : false,

      watch: {
        usePolling: false,
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**']
      },
      
      
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api/, '')
        },
        '/ws': {
          target: 'ws://localhost:3000',
          ws: true
        }
      }
    },

    preview: {
      port: 4173,
      host: true
    },

    build: {
      target: 'ES2022',
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: isProd,
          drop_debugger: isProd
        }
      },
      
      rollupOptions: {
        output: {
          manualChunks: {
            'vendor': ['react', 'react-dom'],
            'ui': ['lucide-react', 'motion'],
            'vendor-api': ['@google/genai', '@google-cloud/secret-manager']
          }
        }
      },
      
      // WASM handling
      assetsDir: 'assets',
      assetsInlineLimit: 4096,
      sourcemap: isDev ? 'inline' : false,
      reportCompressedSize: true
    },

    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'lucide-react',
        'motion'
      ],
      exclude: ['src/wasm/**'],
      esbuildOptions: {
        target: 'esnext',
        supported: {
          bigint: true
        }
      }
    },
    logLevel: isDev ? 'info' : 'warn'
  };
});
