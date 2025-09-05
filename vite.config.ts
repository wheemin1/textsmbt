import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

// 조건부로 Replit 플러그인 로드 (Netlify에서는 건너뛰기)
const loadReplitPlugins = async () => {
  // Netlify 환경에서는 Replit 플러그인을 로드하지 않음
  if (process.env.NETLIFY || process.env.NODE_ENV === "production") {
    return [];
  }
  
  try {
    const runtimeErrorOverlay = (await import("@replit/vite-plugin-runtime-error-modal")).default;
    const cartographer = await import("@replit/vite-plugin-cartographer").then((m) => m.cartographer());
    
    return [
      runtimeErrorOverlay(),
      ...(process.env.REPL_ID !== undefined ? [cartographer] : []),
    ];
  } catch (error) {
    console.warn("Replit plugins not available, continuing without them");
    return [];
  }
};

export default defineConfig(async () => ({
  plugins: [
    react(),
    ...(await loadReplitPlugins()),
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
    },
  },
  root: path.resolve(import.meta.dirname, "client"),
  publicDir: path.resolve(import.meta.dirname, "client", "public"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: false, // Don't empty since server index.js is also here
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@radix-ui/react-dialog'],
        }
      }
    }
  },
  server: {
    host: '0.0.0.0', // 모든 네트워크 인터페이스에서 접근 가능
    port: 5173,      // 기본 Vite 포트
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));
