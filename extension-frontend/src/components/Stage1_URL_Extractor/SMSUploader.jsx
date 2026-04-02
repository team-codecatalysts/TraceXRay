import React, { useState, useRef } from "react";
import { UploadCloud, Trash2, RefreshCcw, Sparkles } from "lucide-react";
import { uploadStage1Image } from "../../lib/apiClient";
import { useStage1 } from "../../lib/useStage1";

const SMSUploader = ({ onAnalysisComplete }) => {
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const { setFirstUrl } = useStage1();

  const ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg"];
  const MAX_SIZE_MB = 5;

  const handleFileSelect = (file) => {
    if (!file) return;

    if (!ALLOWED_TYPES.includes(file.type)) {
      setError("Please upload PNG or JPG images only");
      return;
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`File size must be less than ${MAX_SIZE_MB}MB`);
      return;
    }

    setError(null);
    setImage(file);

    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target.result);
    reader.readAsDataURL(file);
  };

  const handleUpload = async () => {
    if (!image) return;

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("session_id", generateSessionId());

      const data = await uploadStage1Image(formData);
      const output = data.stage1_output;

      if (output) {
        const first = output.extracted_urls?.[0] || null;
        setFirstUrl(first);
        onAnalysisComplete?.(output, preview);
      }
    } catch {
      setError("Processing failed");
    } finally {
      setIsProcessing(false);
    }
  };

  const generateSessionId = () =>
    `session_${Date.now()}_${Math.random().toString(36).slice(2)}`;

  const resetUpload = () => {
    setImage(null);
    setPreview(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8 overflow-hidden relative flex flex-col h-full">
      {/* Header */}
      <div className="text-center mb-6 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-100 to-teal-100 rounded-full mb-3">
          <Sparkles className="w-4 h-4 text-emerald-600" />
          <span className="text-sm font-semibold text-emerald-700">Step 1</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Upload SMS Screenshot
        </h2>
        <p className="text-sm text-gray-500">
          Upload PNG or JPG image (max {MAX_SIZE_MB}MB)
        </p>
      </div>

      {/* Content Area - Grows to fill space */}
      <div className="flex-1 flex flex-col relative z-10">
        {!preview ? (
          <div
            onClick={() => fileInputRef.current?.click()}
            className="flex-1 flex flex-col relative border-2 border-dashed border-[#006b7d] rounded-2xl p-12 text-center bg-gradient-to-br from-emerald-50 to-teal-50 cursor-pointer hover:border-emerald-500 hover:bg-emerald-100 transition-all group"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg"
              className="hidden"
              onChange={(e) => handleFileSelect(e.target.files[0])}
            />

            <div className="flex-1 flex flex-col justify-center">
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-gradient-to-br from-[#006b7d] to-teal-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                  <UploadCloud className="w-10 h-10 text-white" />
                </div>
              </div>

              <p className="font-bold text-lg text-gray-800 mb-2">
                Drop your file here or click to browse
              </p>
              <p className="text-sm text-gray-500 mb-6">
                Supports .png, .jpg, .jpeg • Maximum {MAX_SIZE_MB}MB
              </p>

              <button className="bg-gradient-to-r from-[#006b7d] to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all">
                Select File
              </button>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex flex-col space-y-4">
            <div className="relative group flex-1 flex flex-col">
              <img
                src={preview}
                alt="SMS Preview"
                className="w-full flex-1 object-contain rounded-2xl border-2 border-gray-200 shadow-lg"
                style={{ maxHeight: "calc(100% - 4rem)" }}
              />

              {/* Action Buttons Overlay */}
              <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-white hover:bg-emerald-50 shadow-xl p-3 rounded-xl border-2 border-emerald-300 transition-colors"
                  title="Change image"
                >
                  <RefreshCcw className="w-5 h-5 text-emerald-600" />
                </button>

                <button
                  onClick={resetUpload}
                  className="bg-white hover:bg-red-50 shadow-xl p-3 rounded-xl border-2 border-red-300 transition-colors"
                  title="Remove image"
                >
                  <Trash2 className="w-5 h-5 text-red-600" />
                </button>
              </div>

              {/* Processing Overlay */}
              {isProcessing && (
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/80 to-teal-900/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-white/30 border-t-white rounded-full animate-spin mb-4 mx-auto" />
                    <p className="text-white font-semibold text-lg">
                      Analyzing SMS...
                    </p>
                    <p className="text-emerald-200 text-sm mt-2">Please wait</p>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleUpload}
              disabled={isProcessing}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-lg shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98]"
            >
              {isProcessing ? (
                <span className="flex items-center justify-center gap-3">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Analyze SMS
                </span>
              )}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 bg-gradient-to-r from-red-50 to-rose-100 border-2 border-red-300 text-red-700 rounded-xl p-4 shadow-lg relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-red-500 rounded-full" />
            <p className="font-semibold">⚠️ {error}</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SMSUploader;
