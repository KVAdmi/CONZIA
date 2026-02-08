import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, HashRouter } from "react-router-dom";
import App from "./App";
import "./index.css";

function Router({ children }: { children: React.ReactNode }) {
  const useHash =
    typeof window !== "undefined" &&
    (window.location.protocol === "file:" || window.location.host === "appassets.androidplatform.net");
  return useHash ? <HashRouter>{children}</HashRouter> : <BrowserRouter>{children}</BrowserRouter>;
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Router>
      <App />
    </Router>
  </React.StrictMode>,
);
