import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    // Distinctive, uncommon ports on purpose - 3000/4000/5000 are default
    // ports for many other tools/frameworks and likely to already be in
    // use on a real server. 3417 = this dev server, never deployed; the
    // backend has its own separate port/database per tier - 2417 (dev,
    // proxied to below), 4417 (uat/poc), 5417 (production) - see
    // backend/src/config/env.ts.
    port: 3417,
    proxy: {
      "/api": {
        target: "http://localhost:2417",
        changeOrigin: true,
      },
    },
  },
});
