import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import PsychographicAnalyzer from "../components/Stage1_URL_Extractor/PsychographicAnalyzer";
import HeatmapOverlay from "../components/Stage1_URL_Extractor/HeatmapOverlay";
import { ChevronLeft, Search, Link2, Phone, CheckCircle2, ArrowRight } from "lucide-react";
import { Shield, Lock, Eye, Target, Scan } from "lucide-react";

export default function URLExtractor() {
  const [stage1Data, setStage1Data] = useState(null);
  const [originalImage, setOriginalImage] = useState(null);
  useEffect(() => {

  if (!chrome?.storage) return;

  chrome.storage.local.get(["stage1_output","stage1_image"], (res) => {

  if (res.stage1_output) {
    setStage1Data(res.stage1_output);
    setOriginalImage(res.stage1_image);

    if (res.stage1_output.extracted_urls?.length > 0) {
      chrome.storage.local.set({
        stage1_first_url: res.stage1_output.extracted_urls[0]
      });
}

  }

});

}, []);
 

  return (
    <div className="min-h-screen bg-white">
      {/* Background orbs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-indigo-200/30 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      {/* Sticky Navbar */}
      <div className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
          {/* Back */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </Link>

          {/* Right side */}
          <div className="flex items-center gap-3">
            <button className="inline-flex items-center gap-2 px-4 py-2 rounded-3xl border border-gray-300 bg-white text-sm font-medium text-gray-600 hover:bg-gray-50 transition">
              <Search className="w-4 h-4" />
              Learn how it works
            </button>

            {stage1Data?.extracted_urls?.length > 0 && stage1Data?.urgency_score >= 10 && (
              <Link
                to="/url-result"
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-[#006b7d] text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:scale-105 transition-all"
              >
                <Target className="w-4 h-4" />
                Analyse URL 
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 pt-16 pb-20 relative">
        <div className="text-center mb-16">
          <div className="relative">
            {/* Heading row */}
            <div className="flex items-center justify-center gap-3 mb-4">
              {/* Left icons */}
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 shadow-sm hover:shadow-md transition-shadow">
                <Shield className="w-5 h-5 text-red-600" />
              </div>

              <div className="p-2 rounded-lg bg-teal-50 border border-teal-200 shadow-sm hover:shadow-md transition-shadow ml-2">
                <Lock className="w-4 h-4 text-teal-600" />
              </div>

              {/* Title with subtle glow */}
              <h1 className="text-4xl font-semibold text-[#0f2f35] px-2 ml-5 mr-5 relative">
                Analyse SMS
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-24 h-1 bg-gradient-to-r from-transparent via-[#006b7d] to-transparent rounded-full" />
              </h1>

              {/* Right icons */}
              <div className="p-2 rounded-lg bg-cyan-50 border border-cyan-200 shadow-sm hover:shadow-md transition-shadow mr-2">
                <Eye className="w-4 h-4 text-cyan-600" />
              </div>

              <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200 shadow-sm hover:shadow-md transition-shadow">
                <Scan className="w-5 h-5 text-yellow-600" />
              </div>
            </div>

            <p className="text-lg text-[#006b7d] mt-5 max-w-xl mx-auto">
              OCR, psychographic analysis & visual threat detection powered by AI
            </p>
          </div>
        </div>

        {/* Dynamic Layout Container */}
        <div className={`transition-all duration-700 ${stage1Data ? 'max-w-full' : 'max-w-3xl mx-auto'}`}>
          
          {/* Top Section: SMS Uploader + Heatmap (Side by Side after analysis) */}
          <div className="grid gap-8 mb-10 grid-cols-1">
          
            {/* Heatmap - Appears on right after analysis */}
            {stage1Data && (
              <div className="animate-slideInRight flex">
                <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        Visual Threat Detection
                      </h3>
                      <p className="text-sm text-gray-500">
                        AI-powered heatmap analysis of suspicious regions
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-semibold rounded-lg">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      AI Analyzed
                    </div>
                  </div>
                  <div className="flex-1">
                    <HeatmapOverlay
                      originalImage={originalImage}
                      heatmapData={stage1Data.heatmap_data || []}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Results Section - Below the top section */}
          {stage1Data && (
            <div className="space-y-10 animate-slideUp">
              {/* Psychographic Analysis - Full Width */}
              <PsychographicAnalyzer
                extractedText={stage1Data.extracted_text}
                urgencyScore={stage1Data.urgency_score}
                flaggedPhrases={stage1Data.flagged_phrases}
                extractedUrls={stage1Data.extracted_urls}
                extractedPhones={stage1Data.extracted_phones}
                category={stage1Data.category}
              />

              {/* Extracted Intelligence Grid - Symmetrical Two Columns */}
              <div className="grid md:grid-cols-2 gap-8">
                {/* URLs Section */}
                {stage1Data.extracted_urls.length > 0 && (
                  <div className="bg-red-50 rounded-2xl shadow-lg p-6 border border-red-200">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-red-200">
                      <div className="p-2.5 bg-red-100 rounded-lg border border-red-200">
                        <Link2 className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-red-900 text-lg">Suspicious URLs</h3>
                        <p className="text-sm text-red-700">
                          {stage1Data.extracted_urls.length} link{stage1Data.extracted_urls.length !== 1 ? 's' : ''} detected
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {stage1Data.extracted_urls.map((url, i) => (
                        <li
                          key={i}
                          className="bg-white rounded-lg px-4 py-3 border border-red-200 shadow-sm hover:shadow-md hover:border-red-300 transition-all"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                            <span className="text-sm text-gray-800 break-all font-mono">
                              {url}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Phone Numbers Section */}
                {stage1Data.extracted_phones.length > 0 && (
                  <div className="bg-yellow-50 rounded-2xl shadow-lg p-6 border border-yellow-200">
                    <div className="flex items-center gap-3 mb-5 pb-4 border-b border-yellow-200">
                      <div className="p-2.5 bg-yellow-100 rounded-lg border border-yellow-200">
                        <Phone className="w-5 h-5 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="font-bold text-yellow-900 text-lg">Contact Numbers</h3>
                        <p className="text-sm text-yellow-700">
                          {stage1Data.extracted_phones.length} number{stage1Data.extracted_phones.length !== 1 ? 's' : ''} found
                        </p>
                      </div>
                    </div>
                    <ul className="space-y-3">
                      {stage1Data.extracted_phones.map((phone, i) => (
                        <li
                          key={i}
                          className="bg-white rounded-lg px-4 py-3 border border-yellow-200 shadow-sm hover:shadow-md hover:border-yellow-300 transition-all"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-1.5 h-1.5 bg-yellow-600 rounded-full flex-shrink-0" />
                            <span className="text-sm text-gray-800 font-mono font-semibold">
                              {phone}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Empty State - Spans Both Columns */}
                {stage1Data.extracted_urls.length === 0 &&
                  stage1Data.extracted_phones.length === 0 && (
                    <div className="col-span-2 bg-emerald-50 rounded-2xl shadow-lg p-12 border border-emerald-200 text-center">
                      <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-200">
                        <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-2">All Clear!</h3>
                      <p className="text-gray-600">No suspicious URLs or phone numbers detected</p>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add custom animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.5s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.6s ease-out;
        }
        .animate-slideInRight {
          animation: slideInRight 0.7s ease-out;
        }
      `}</style>
    </div>
  );
}