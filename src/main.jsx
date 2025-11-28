// /src/main.jsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import router from "./routes/index.jsx";
import AuthProvider from "./providers/AuthProvider";

// MUI
import { ThemeProvider, CssBaseline } from "@mui/material";
import theme from "./theme"; // 우리가 만들 theme.js

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);
