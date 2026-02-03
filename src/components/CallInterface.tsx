import { useState, useRef, useEffect } from 'react';
import { CallState, type PromptConfig } from '../types';
import { OpenAIRealtimeConnection } from '../lib/openai-realtime';
import PhoneVisualization from './PhoneVisualization';
import RingingPhone from './RingingPhone';

export default function CallInterface() {
  const [callState, setCallState] = useState<CallState>(CallState.IDLE);
  const [error, setError] = useState<string>('');
  const [isAgentSpeaking, setIsAgentSpeaking] = useState(false);

  const connectionRef = useRef<OpenAIRealtimeConnection | null>(null);
  const speakingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    if (connectionRef.current) {
      connectionRef.current.disconnect();
      connectionRef.current = null;
    }
    if (speakingTimeoutRef.current) {
      clearTimeout(speakingTimeoutRef.current);
      speakingTimeoutRef.current = null;
    }
  };

  const startCall = () => {
    setCallState(CallState.RINGING);
    setError('');
  };

  const answerCall = async () => {
    setCallState(CallState.CONNECTING);

    try {
      const configResponse = await fetch('/api/config/get');
      const promptConfig: PromptConfig = await configResponse.json();

      connectionRef.current = new OpenAIRealtimeConnection({
        promptConfig,
        onAgentSpeaking: () => {
          setIsAgentSpeaking(true);
          setCallState(CallState.AGENT_SPEAKING);

          if (speakingTimeoutRef.current) {
            clearTimeout(speakingTimeoutRef.current);
          }

          speakingTimeoutRef.current = setTimeout(() => {
            setIsAgentSpeaking(false);
            setCallState(CallState.CONVERSATION);
          }, 500);
        },
        onAgentFinished: () => {
          setIsAgentSpeaking(false);
          setCallState(CallState.CONVERSATION);
        },
        onError: (errorMessage) => {
          setError(errorMessage);
          endCall();
        },
        onConnectionEstablished: () => {
          setCallState(CallState.USER_SPEAKING);
        },
      });

      await connectionRef.current.connect();
    } catch (err) {
      console.error('Error starting call:', err);
      setError(err instanceof Error ? err.message : 'Verbindung fehlgeschlagen');
      setCallState(CallState.IDLE);
    }
  };

  const declineCall = () => {
    setCallState(CallState.IDLE);
  };

  const endCall = () => {
    cleanup();
    setCallState(CallState.ENDED);

    setTimeout(() => {
      setCallState(CallState.IDLE);
      setError('');
    }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="w-full max-w-md">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <p className="text-sm text-red-800 font-medium">{error}</p>
              </div>
              <button
                onClick={() => setError('')}
                className="ml-4 text-red-400 hover:text-red-600 transition-colors"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* IDLE State */}
        {callState === CallState.IDLE && (
          <div className="bg-white rounded-3xl shadow-2xl overflow-hidden">
            {/* Hero Section */}
            <div className="bg-gradient-to-br from-[var(--drk-red)] to-[var(--drk-red-dark)] px-8 pt-12 pb-8 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-sm rounded-3xl mb-6">
                <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold text-white mb-3">
                DRK Anrufsimulator
              </h1>
              <p className="text-red-100 text-sm">
                Trainingsumgebung f&uuml;r Spendenerh&ouml;hungsanrufe
              </p>
            </div>

            {/* Content Section */}
            <div className="p-8 space-y-6">
              {/* Call to action button */}
              <button
                onClick={startCall}
                className="w-full bg-gradient-to-r from-[var(--drk-red)] to-[var(--drk-red-dark)] hover:shadow-xl text-white py-4 px-8 rounded-2xl font-semibold transition-all duration-200 hover:scale-[1.02] flex items-center justify-center space-x-3"
              >
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                <span className="text-lg">Anruf starten</span>
              </button>

              {/* Feature list */}
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-red-100 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-[var(--drk-red)]" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">KI-gest&uuml;tzte Konversation</div>
                    <div className="text-sm text-gray-500">Realistische Gespr&auml;che mit OpenAI Realtime API</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Jederzeit verf&uuml;gbar</div>
                    <div className="text-sm text-gray-500">24/7 Training ohne Wartezeit</div>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center mt-0.5">
                    <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">Sicher &amp; privat</div>
                    <div className="text-sm text-gray-500">DSGVO-konform und verschl&uuml;sselt</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* RINGING State */}
        {callState === CallState.RINGING && (
          <RingingPhone onAnswer={answerCall} onDecline={declineCall} />
        )}

        {/* CONNECTING State */}
        {callState === CallState.CONNECTING && (
          <div className="text-center bg-white rounded-2xl shadow-xl p-10 border border-gray-100">
            <div className="relative w-20 h-20 mx-auto mb-6">
              <div className="absolute inset-0 border-4 border-gray-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-transparent border-t-[var(--drk-red)] rounded-full animate-spin"></div>
              <div className="absolute inset-3 flex items-center justify-center bg-red-50 rounded-full">
                <svg className="w-6 h-6 text-[var(--drk-red)]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Verbindung wird hergestellt</h3>
            <p className="text-sm text-gray-500">Einen Moment bitte...</p>
          </div>
        )}

        {/* ACTIVE CALL States */}
        {(callState === CallState.USER_SPEAKING ||
          callState === CallState.AGENT_SPEAKING ||
          callState === CallState.CONVERSATION) && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl shadow-xl p-6 border border-gray-100">
              <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">Aktiver Anruf</h2>
                  <p className="text-sm text-gray-500">Deutsches Rotes Kreuz</p>
                </div>
                <div className="flex items-center space-x-2 bg-green-50 px-3 py-1.5 rounded-full">
                  <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span className="text-xs font-semibold text-green-700 uppercase tracking-wide">Live</span>
                </div>
              </div>

              <PhoneVisualization isSpeaking={isAgentSpeaking} />
            </div>

            <button
              onClick={endCall}
              className="group w-full bg-gradient-to-r from-[var(--drk-red)] to-[var(--drk-red-dark)] hover:shadow-lg text-white py-4 px-6 rounded-xl font-semibold transition-all duration-200 hover:scale-[1.02] flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
              <span>Anruf beenden</span>
            </button>
          </div>
        )}

        {/* ENDED State */}
        {callState === CallState.ENDED && (
          <div className="text-center bg-white rounded-2xl shadow-xl p-10 border border-gray-100 space-y-5">
            <div className="w-20 h-20 mx-auto bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-inner">
              <svg className="w-10 h-10 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Anruf beendet</h2>
              <p className="text-gray-500 mt-2">Kehre zum Startbildschirm zur&uuml;ck...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
