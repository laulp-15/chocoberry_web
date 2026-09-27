// src/main.jsx

import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App.jsx";

// Importar Providers
import { AuthProvider } from "./features/login/hooks/useAuth.jsx";
import { ToastProvider } from "./shared/components/Toast.jsx";
import { ThemeProvider } from "./shared/context/ThemeContext"; // <- Importamos el ThemeProvider

import "bootstrap/dist/css/bootstrap.min.css";
import "./shared/css/tokens.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider> {/* <- Envuelve toda la aplicación aquí */}
        <AuthProvider>
          <ToastProvider>
            <App />
          </ToastProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>
);