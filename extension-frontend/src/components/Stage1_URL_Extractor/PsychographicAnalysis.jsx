import React, { useEffect, useState } from "react";
import {
  Download,
  AlertTriangle,
  Shield,
  Activity,
  TrendingUp,
  Link2,
  Phone,
  MessageSquare,
  Target,
} from "lucide-react";

const PsychographicAnalyzer = ({
  extractedText = "",
  urgencyScore = 0,
  flaggedPhrases = [],
  extractedUrls = [],
  extractedPhones = [],
  category = "Other",
}) => {
  const [analysis, setAnalysis] = useState(null);

  useEffect(() => {
    if (
      extractedText ||
      urgencyScore > 0 ||
      extractedUrls.length > 0 ||
      extractedPhones.length > 0
    ) {
      setAnalysis({
        extracted_text: extractedText,
        urgency_score: urgencyScore,
        flagged_phrases: flaggedPhrases,
        extracted_urls: extractedUrls,
        extracted_phones: extractedPhones,
        category,
        timestamp: new Date().toISOString(),
      });
    }
  }, [
    extractedText,
    urgencyScore,
    flaggedPhrases,
    extractedUrls,
    extractedPhones,
    category,
  ]);

  const downloadJSON = () => {
    if (!analysis) return;

    const blob = new Blob([JSON.stringify(analysis, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.download = `stage1_psychographic_${Date.now()}.json`;
    link.click();

    URL.revokeObjectURL(url);
  };

  const getUrgencyData = (score) => {
    if (score >= 80) {
      return {
        color: "bg-red-600",
        bgColor: "bg-red-50",
        borderColor: "border-red-200",
        textColor: "text-red-700",
        dotColor: "bg-red-500",
        label: "Critical Threat",
        icon: <AlertTriangle className="w-5 h-5" />,
      };
    }
    if (score >= 50) {
      return {
        color: "bg-yellow-600",
        bgColor: "bg-yellow-50",
        borderColor: "border-yellow-200",
        textColor: "text-yellow-700",
        dotColor: "bg-yellow-500",
        label: "Moderate Risk",
        icon: <TrendingUp className="w-5 h-5" />,
      };
    }
    return {
      color: "bg-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      textColor: "text-green-700",
      dotColor: "bg-green-500",
      label: "Low Risk",
      icon: <Shield className="w-5 h-5" />,
    };
  };

  if (!analysis) return null;

  const urgencyData = getUrgencyData(urgencyScore);

  return (
    <div className="bg-white rounded-2xl shadow-lg p-8 border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-[#006b7d] rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-2xl font-bold text-gray-900">
              Psychographic Analysis
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              AI-powered behavioral insights
            </p>
          </div>
        </div>
        <button
          onClick={downloadJSON}
          className="flex items-center gap-2 bg-[#006b7d] hover:bg-[#005a6a] text-white px-5 py-2.5 rounded-lg font-medium shadow-sm hover:shadow transition-all text-sm"
        >
          <Download className="w-4 h-4" />
          Export Data
        </button>
      </div>

      {/* Main Stats Grid */}
      <div className="grid md:grid-cols-3 gap-6 mb-8">
        {/* Urgency Score - Large Card */}
        <div
          className={`md:col-span-2 ${urgencyData.bgColor} rounded-xl p-6 border ${urgencyData.borderColor}`}
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`p-2 rounded-lg ${urgencyData.bgColor} border ${urgencyData.borderColor}`}
                >
                  <div className={urgencyData.textColor}>
                    {urgencyData.icon}
                  </div>
                </div>
                <span
                  className={`text-sm font-semibold ${urgencyData.textColor}`}
                >
                  {urgencyData.label}
                </span>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-5xl font-bold text-gray-900">
                  {urgencyScore}
                </p>
                <span className="text-xl text-gray-400 font-medium">/100</span>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="relative w-full h-3 bg-white rounded-full overflow-hidden border border-gray-200">
            <div
              className={`h-full ${urgencyData.color} transition-all duration-1000 ease-out`}
              style={{ width: `${urgencyScore}%` }}
            />
          </div>
        </div>

        {/* Category Card */}
        <div className="bg-blue-50 rounded-xl p-6 border border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-5 h-5 text-blue-600" />
            <p className="text-sm font-semibold text-blue-600">
              Threat Category
            </p>
          </div>
          <p className="text-2xl font-bold text-blue-900 break-words">
            {category}
          </p>
        </div>
      </div>

      {/* Detailed Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-[#006b7d] hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-[#e8f6f9] rounded-lg">
              <Link2 className="w-5 h-5 text-[#006b7d]" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {extractedUrls.length}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">URLs Found</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-blue-400 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Phone className="w-5 h-5 text-blue-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {extractedPhones.length}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">Phone Numbers</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-red-400 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-50 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {flaggedPhrases.length}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">Flagged Phrases</p>
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-200 hover:border-yellow-400 hover:shadow-md transition-all">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <MessageSquare className="w-5 h-5 text-yellow-600" />
            </div>
            <span className="text-2xl font-bold text-gray-900">
              {extractedText.split(" ").filter((w) => w).length}
            </span>
          </div>
          <p className="text-sm font-medium text-gray-600">Words</p>
        </div>
      </div>

      {/* Flagged Phrases Section */}
      {flaggedPhrases.length > 0 && (
        <div className="bg-red-50 rounded-xl p-6 border border-red-200 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 bg-red-100 rounded-lg border border-red-200">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h5 className="font-bold text-red-900">
                Suspicious Language Detected
              </h5>
              <p className="text-sm text-red-700 mt-0.5">
                {flaggedPhrases.length} manipulative phrase
                {flaggedPhrases.length !== 1 ? "s" : ""} identified
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {flaggedPhrases.map((phrase, index) => (
              <span
                key={index}
                className="px-4 py-2 bg-white text-red-700 text-sm font-medium rounded-lg border border-red-300 hover:border-red-400 transition-colors"
              >
                "{phrase}"
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Extracted Text Preview */}
      {extractedText && (
        <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full ${urgencyData.dotColor}`} />
            <p className="text-sm font-bold text-gray-700">Extracted Message</p>
          </div>
          <div className="bg-white rounded-lg p-4 max-h-32 overflow-y-auto border border-gray-200">
            <p className="text-sm text-gray-700 leading-relaxed">
              {extractedText}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PsychographicAnalyzer;
