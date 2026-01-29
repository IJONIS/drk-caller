import React, { useEffect, useRef } from 'react';

interface RingingPhoneProps {
  onAnswer: () => void;
  onDecline: () => void;
}

export default function RingingPhone({ onAnswer, onDecline }: RingingPhoneProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    // Create audio element for ringing sound
    audioRef.current = new Audio('/sounds/phone-ring.mp3');
    audioRef.current.loop = true;
    audioRef.current.play().catch(err => {
      console.warn('Could not play ring sound:', err);
    });

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleAnswer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onAnswer();
  };

  const handleDecline = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    onDecline();
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-8">
      {/* Phone Icon with Pulsing Animation */}
      <div className="relative">
        <div className="absolute inset-0 w-32 h-32 bg-green-400 rounded-full animate-ping opacity-75" />
        <div className="relative w-32 h-32 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
          <svg
            className="w-16 h-16 text-white animate-bounce"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
          </svg>
        </div>
      </div>

      {/* Text */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Eingehender Anruf</h2>
        <p className="text-gray-600">Deutsches Rotes Kreuz</p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-4">
        <button
          onClick={handleDecline}
          className="px-8 py-3 bg-red-500 text-white rounded-full hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-colors"
        >
          Ablehnen
        </button>
        <button
          onClick={handleAnswer}
          className="px-8 py-3 bg-green-500 text-white rounded-full hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
        >
          Annehmen
        </button>
      </div>
    </div>
  );
}
