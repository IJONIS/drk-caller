import React from 'react';

interface PhoneVisualizationProps {
  isSpeaking: boolean;
}

export default function PhoneVisualization({ isSpeaking }: PhoneVisualizationProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6">
      {/* Animated Circles */}
      <div className="relative w-48 h-48 flex items-center justify-center">
        {isSpeaking && (
          <>
            <div className="absolute w-48 h-48 rounded-full bg-redcross opacity-20 animate-ping" />
            <div className="absolute w-40 h-40 rounded-full bg-redcross opacity-30 animate-pulse" />
            <div className="absolute w-32 h-32 rounded-full bg-redcross opacity-40 animate-ping animation-delay-300" />
          </>
        )}

        {/* Center Circle */}
        <div className={`w-24 h-24 rounded-full flex items-center justify-center transition-all duration-300 ${
          isSpeaking ? 'bg-redcross scale-110' : 'bg-redcross/60 scale-100'
        }`}>
          <svg
            className="w-12 h-12 text-white"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
      </div>

      {/* Status Text */}
      <div className="text-center">
        <p className={`text-lg font-medium transition-colors duration-300 ${
          isSpeaking ? 'text-redcross' : 'text-gray-600'
        }`}>
          {isSpeaking ? 'Agent spricht...' : 'Zuhören...'}
        </p>
      </div>
    </div>
  );
}
