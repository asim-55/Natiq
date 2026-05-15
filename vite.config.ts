import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import fs from "node:fs";
import path from "node:path";

const certDir = path.resolve(__dirname, "certs");
const certFile = path.join(certDir, "10.101.0.21.nip.io.crt");
const keyFile = path.join(certDir, "10.101.0.21.nip.io.key");
const hasHttpsCert = fs.existsSync(certFile) && fs.existsSync(keyFile);

export default defineConfig({
  plugins: [react()],
  server: {
    host: "0.0.0.0",
    port: 5173,
    allowedHosts: ["10.101.0.21.nip.io"],
    headers: {
      // Allow Google OAuth popup to postMessage back to the page
      "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
    },
    https: hasHttpsCert
      ? {
          cert: fs.readFileSync(certFile),
          key: fs.readFileSync(keyFile),
        }
      : undefined,
    proxy: {
      "/api": {
        target: "http://10.101.0.21:8000",
        changeOrigin: true,
        ws: true,
        rewrite: (p) => p.replace(/^\/api/, ""),
      },
    },
  },
});
