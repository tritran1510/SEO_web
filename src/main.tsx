import React from "react";
import ReactDOM from "react-dom/client";
import "./app/i18n/i18n";
import App from "./app/App";
import "./app/index.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Không tìm thấy phần tử gốc #root.");
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
