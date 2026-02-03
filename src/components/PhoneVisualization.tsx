interface PhoneVisualizationProps {
  isSpeaking: boolean;
}

export default function PhoneVisualization({ isSpeaking }: PhoneVisualizationProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-6 py-4">
      {/* Visualization */}
      <div className="relative flex justify-center h-32">
        {/* Ripples when speaking */}
        {isSpeaking && (
          <>
            <div className="absolute w-32 h-32 bg-[var(--drk-red)] rounded-full opacity-10 animate-ripple" />
            <div className="absolute w-32 h-32 bg-[var(--drk-red)] rounded-full opacity-10 animate-ripple" style={{ animationDelay: '0.5s' }} />
          </>
        )}

        {/* Center Icon */}
        <div className={`relative w-24 h-24 rounded-full flex items-center justify-center shadow-lg transition-all ${
          isSpeaking ? 'bg-[var(--drk-red)] scale-110' : 'bg-gray-400'
        }`}>
          <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
            />
          </svg>
        </div>
      </div>

      {/* Status */}
      <div className="text-center">
        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-full ${
          isSpeaking ? 'bg-[var(--drk-red)] text-white' : 'bg-gray-200 text-gray-700'
        }`}>
          <div className={`w-2 h-2 rounded-full ${isSpeaking ? 'bg-white animate-pulse' : 'bg-gray-600'}`} />
          <span className="text-sm font-medium uppercase">
            {isSpeaking ? 'Agent spricht' : 'Zuhören'}
          </span>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          {isSpeaking ? 'KI-gestützte Antwort wird generiert' : 'Warte auf Ihre Antwort'}
        </p>
      </div>
    </div>
  );
}
