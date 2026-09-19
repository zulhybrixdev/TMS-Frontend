import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./lib/auth-context";
import { queryClient } from "./lib/query-client";
import App from "./App";
import "@fontsource-variable/inter";
import "@fontsource/space-grotesk/500.css";
import "@fontsource/space-grotesk/600.css";
import "@fontsource/space-grotesk/700.css";
import "@fontsource/ibm-plex-mono/400.css";
import "@fontsource/ibm-plex-mono/500.css";
import "@fontsource/ibm-plex-mono/600.css";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* Vite sets BASE_URL from the --base flag used at build time
            ("/poc/" for build:poc, "/" otherwise) - so the same source
            self-adjusts to whichever path prefix it's actually served
            under, instead of hardcoding "/". */}
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <App />
          <Toaster position="top-right" richColors closeButton toastOptions={{ duration: 4500 }} />
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
