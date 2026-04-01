import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Routes, Route } from "react-router-dom";

import Popup from "./popup/Popup";
import URLExtractor from "./pages/URLExtractor";
import URLResult from "./pages/URLResult";
import Sandbox from "./pages/Sandbox";
import ScamReplay from "./pages/ScamReplay";
import ForensicReportPage from "./pages/ForensicReport";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <HashRouter>
      <Routes>

        <Route path="/" element={<Popup />} />

        <Route path="/url-extractor" element={<URLExtractor />} />
        <Route path="/url-result" element={<URLResult />} />
        <Route path="/sandbox" element={<Sandbox />} />
        <Route path="/replay" element={<ScamReplay />} />
        <Route path="/forensic-report" element={<ForensicReportPage />} />
      </Routes>
    </HashRouter>
  </React.StrictMode>
);