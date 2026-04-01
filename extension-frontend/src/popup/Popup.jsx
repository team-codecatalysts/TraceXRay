import { useState } from "react";
import { uploadStage1Image } from "../lib/apiClient";
import { saveStage1 } from "../extension/storage/stageStorage";
import { Shield, Link2, Brain, ScanLine, Lock, Zap, Search, ChevronRight } from "lucide-react";

function dataUrlToBlob(dataUrl) {
  const arr = dataUrl.split(",");
  const mime = arr[0].match(/:(.*?);/)[1];
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) { u8arr[n] = bstr.charCodeAt(n); }
  return new Blob([u8arr], { type: mime });
}

const SCAN_STEPS = ["Capturing screenshot…", "Uploading image…", "Analyzing with AI…", "Opening results…"];

export default function Popup() {
  const [manualUrl, setManualUrl] = useState("");
  const [urlLoading, setUrlLoading] = useState(false);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanStep, setScanStep] = useState(0);

  const analyzeManualUrl = async () => {
    if (!manualUrl.trim()) return;
    setUrlLoading(true);
    try {
      chrome.storage.local.set({ stage1_first_url: manualUrl.trim() });
      chrome.tabs.create({ url: chrome.runtime.getURL("index.html#/url-result") });
    } finally {
      setUrlLoading(false);
    }
  };

  const startScan = async () => {
    setScanLoading(true);
    setScanStep(0);
    try {
      const response = await chrome.runtime.sendMessage({ action: "START_STAGE1_SCAN" });
      if (!response?.screenshot) { setScanLoading(false); return; }
      setScanStep(1);
      const blob = dataUrlToBlob(response.screenshot);
      const file = new File([blob], "sms.png", { type: "image/png" });
      const formData = new FormData();
      formData.append("image", file);
      formData.append("session_id", crypto.randomUUID());
      setScanStep(2);
      const result = await uploadStage1Image(formData);
      saveStage1(result.stage1_output);
      chrome.storage.local.set({ stage1_output: result.stage1_output, stage1_image: response.screenshot });
      setScanStep(3);
      chrome.tabs.create({ url: chrome.runtime.getURL("index.html#/url-extractor") });
    } finally {
      setScanLoading(false);
      setScanStep(0);
    }
  };

  return (
    <div className="w-[360px] bg-white overflow-hidden">

      {/* Header */}
      <div className="relative bg-gradient-to-br from-[#004554] via-[#006b7d] to-[#0099cc] px-5 pt-5 pb-8 overflow-hidden">
        {/* Decorative rings */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full border border-white/10" />
        <div className="absolute -top-4 -right-4 w-28 h-28 rounded-full border border-white/10" />
        <div className="absolute bottom-0 left-0 w-full h-6 bg-white rounded-t-[28px]" />

        <div className="relative flex items-center gap-3">
          <div className="relative">
            <div className="w-11 h-11 rounded-2xl bg-white/20 border border-white/30 backdrop-blur-sm flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            {/* Pulse ring */}
            <div className="absolute inset-0 rounded-2xl border-2 border-white/40 animate-ping" />
          </div>

          <div className="flex-1">
            <div className="text-white text-[18px] font-extrabold tracking-tight leading-none">PhantomClick</div>
            <div className="text-white/65 text-[10px] mt-0.5 font-medium tracking-wide">AI-Powered Scam Forensics</div>
          </div>

          <div className="flex items-center gap-1.5 bg-[#4ade80]/20 border border-[#4ade80]/40 rounded-full px-2.5 py-1">
            <div className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-[#4ade80] text-[9px] font-bold tracking-widest">LIVE</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 pb-4 -mt-1 flex flex-col gap-3">

        {/* URL Card */}
        <div className="rounded-2xl border-2 border-[#e3f2fd] bg-gradient-to-br from-[#f0f8ff] to-white p-4 shadow-sm">

          <div className="flex items-center gap-2 mb-3">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-[#1e6fa1] to-[#3a8fc4] flex items-center justify-center">
              <Link2 className="w-3 h-3 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-bold text-[#004554] tracking-widest uppercase">Analyze URL</span>
          </div>

          <div className="relative mb-2.5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9ac4d8]" strokeWidth={2.5} />
            <input
              type="text"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && manualUrl.trim() && analyzeManualUrl()}
              placeholder="Paste suspicious link…"
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border-2 border-[#dceef8] bg-white text-[13px] text-[#004554] placeholder-[#b0d4e3] outline-none focus:border-[#0099cc] focus:ring-2 focus:ring-[#0099cc]/10 transition"
            />
          </div>

          <button
            onClick={analyzeManualUrl}
            disabled={!manualUrl.trim() || urlLoading}
            className="w-full py-2.5 rounded-xl bg-gradient-to-r from-[#1e6fa1] to-[#0099cc] text-white text-[13px] font-bold shadow-md shadow-blue-400/25 hover:-translate-y-0.5 hover:shadow-blue-400/40 active:translate-y-0 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0 transition-all duration-150 flex items-center justify-center gap-2 group"
          >
            {urlLoading ? (
              <>
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.3" strokeWidth="3" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                </svg>
                Analyzing…
              </>
            ) : (
              <>
                Analyze URL
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={2.5} />
              </>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 px-1">
          <div className="flex-1 h-px bg-gradient-to-r from-transparent via-[#cde8f2] to-[#cde8f2]" />
          <span className="text-[10px] font-bold text-[#aacfdb] tracking-[4px]">OR</span>
          <div className="flex-1 h-px bg-gradient-to-l from-transparent via-[#cde8f2] to-[#cde8f2]" />
        </div>

        {/* Scam-Brain Scan Card */}
        <div className="rounded-2xl overflow-hidden shadow-lg shadow-teal-700/15">

          <button
            onClick={startScan}
            disabled={scanLoading}
            className="w-full bg-gradient-to-br from-[#005566] via-[#006b7d] to-[#004554] text-white disabled:cursor-not-allowed transition-all duration-200 hover:brightness-110 active:scale-[0.99] group"
          >
            {scanLoading ? (
              <div className="px-5 py-4 flex flex-col items-center gap-3">
                <div className="flex items-center gap-2.5 text-[13px] font-semibold">
                  <svg className="w-4 h-4 animate-spin shrink-0" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="white" strokeOpacity="0.3" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  {SCAN_STEPS[scanStep]}
                </div>
                <div className="flex items-center gap-1.5">
                  {SCAN_STEPS.map((_, i) => (
                    <div key={i} className={`rounded-full transition-all duration-300 ${
                      i < scanStep ? "w-2 h-2 bg-[#4ade80]"
                      : i === scanStep ? "w-3 h-3 bg-white"
                      : "w-2 h-2 bg-white/25"
                    }`} />
                  ))}
                </div>
                <div className="w-full h-1 rounded-full bg-white/15 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#4ade80] to-[#00c2e0] transition-all duration-500"
                    style={{ width: `${((scanStep + 1) / SCAN_STEPS.length) * 100}%` }}
                  />
                </div>
              </div>
            ) : (
              <div className="px-5 py-4 flex items-center gap-4">
                {/* Icon cluster */}
                <div className="relative shrink-0">
                  <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/20 flex items-center justify-center">
                    <Brain className="w-6 h-6 text-white" strokeWidth={1.8} />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#4ade80] border-2 border-[#006b7d] flex items-center justify-center">
                    <ScanLine className="w-2 h-2 text-[#004554]" strokeWidth={3} />
                  </div>
                </div>

                <div className="flex-1 text-left">
                  <div className="text-[14px] font-extrabold leading-tight">Scan Current Tab</div>
                  <div className="text-white/60 text-[10px] mt-0.5 font-medium">Scan your SMS with AI</div>
                </div>

                <ChevronRight className="w-4 h-4 text-white/50 group-hover:text-white group-hover:translate-x-0.5 transition-all shrink-0" strokeWidth={2.5} />
              </div>
            )}
          </button>

          {/* Card footer strip */}
          <div className="bg-[#003d4a] px-5 py-2 flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-medium">
              <Lock className="w-2.5 h-2.5" strokeWidth={2.5} />
              Sandboxed & encrypted
            </div>
            <div className="flex items-center gap-1.5 text-[9px] text-white/40 font-medium">
              <Zap className="w-2.5 h-2.5" strokeWidth={2.5} />
              GenAI-powered
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}