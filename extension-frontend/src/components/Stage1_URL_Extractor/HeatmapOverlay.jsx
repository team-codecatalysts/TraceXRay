import React, { useRef, useEffect, useState } from "react";
import { Loader2, Scan } from "lucide-react";

const HeatmapOverlay = ({ originalImage, heatmapData }) => {
  const canvasRef = useRef(null);
  const [isRendered, setIsRendered] = useState(false);

  useEffect(() => {
    if (originalImage && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img = new Image();

      img.onload = () => {
        const MAX_WIDTH = 1000;
        const scale = Math.min(1, MAX_WIDTH / img.width);

        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Draw base image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        // Draw heatmap boxes
        if (heatmapData && heatmapData.length > 0) {
          heatmapData.forEach((item) => {
            const [origX0, origY0, origX1, origY1] = item.position;

            const x = origX0 * scale;
            const y = origY0 * scale;
            const w = (origX1 - origX0) * scale;
            const h = (origY1 - origY0) * scale;

            const color = getHeatmapColor(item.intensity);

            // Fill with semi-transparent color
            ctx.fillStyle = `rgba(${color.r}, ${color.g}, ${color.b}, 0.25)`;
            ctx.fillRect(x, y, w, h);

            // Draw border
            ctx.strokeStyle = `rgb(${color.r}, ${color.g}, ${color.b})`;
            ctx.lineWidth = 2.5;
            ctx.strokeRect(x, y, w, h);
          });
        }

        setIsRendered(true);
      };

      img.src = originalImage;
    }
  }, [originalImage, heatmapData]);

  const getHeatmapColor = (intensity) => {
    if (intensity > 0.8) return { r: 220, g: 38, b: 38 }; // Red-600
    if (intensity > 0.5) return { r: 234, g: 179, b: 8 }; // Yellow-500
    return { r: 16, g: 185, b: 129 }; // Emerald-500
  };

  return (
    <div className="relative">
      {/* Canvas Container */}
      <div className="relative flex justify-center bg-gray-50 rounded-xl p-6 border border-gray-200">
        <canvas ref={canvasRef} className="rounded-lg shadow-md max-w-full" />

        {!isRendered && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm rounded-xl">
            <div className="text-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                  <Scan className="w-8 h-8 text-emerald-600 animate-pulse" />
                </div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <Loader2 className="w-20 h-20 text-emerald-400 animate-spin" />
                </div>
              </div>
              <p className="text-sm font-semibold text-gray-700">
                Analyzing security layers...
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Heatmap Legend */}
      {isRendered && heatmapData && heatmapData.length > 0 && (
        <div className="mt-6 bg-white rounded-xl p-4 border border-gray-200 shadow-sm">
          <div className="flex items-center justify-center gap-8 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-emerald-500 rounded-md border-2 border-emerald-600 shadow-sm" />
              <span className="text-gray-700 font-medium">Low Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-yellow-500 rounded-md border-2 border-yellow-600 shadow-sm" />
              <span className="text-gray-700 font-medium">Medium Risk</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 bg-red-600 rounded-md border-2 border-red-700 shadow-sm" />
              <span className="text-gray-700 font-medium">High Risk</span>
            </div>
          </div>
        </div>
      )}

      {/* No Threats Detected Message */}
      {isRendered && (!heatmapData || heatmapData.length === 0) && (
        <div className="mt-6 bg-emerald-50 rounded-xl p-4 border border-emerald-200">
          <p className="text-center text-emerald-700 font-medium text-sm">
            ✓ No suspicious regions detected in this image
          </p>
        </div>
      )}
    </div>
  );
};

export default HeatmapOverlay;
