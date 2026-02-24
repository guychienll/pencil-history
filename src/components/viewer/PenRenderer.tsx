// T057: PenRenderer component

import React from "react";
import { LoadingSpinner } from "@/components/layout/LoadingSpinner";

export interface PenRendererProps {
  imageData: string | null;
  loading?: boolean;
  width?: number;
  height?: number;
  className?: string;
}

export function PenRenderer({
  imageData,
  loading = false,
  width,
  height,
  className = "",
}: PenRendererProps) {
  if (loading) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center">
          <LoadingSpinner size="lg" />
          <p className="mt-4 text-sm text-gray-600">正在生成截圖...</p>
        </div>
      </div>
    );
  }

  if (!imageData) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 ${className}`}
        style={{ width, height }}
      >
        <div className="text-center text-gray-500">
          <svg
            className="mx-auto h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <p className="mt-2">尚無截圖</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center bg-gray-100 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageData}
        alt="Pen file screenshot"
        className="max-h-full max-w-full object-contain"
        style={{ width, height }}
      />
    </div>
  );
}
