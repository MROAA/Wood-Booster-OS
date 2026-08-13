/**
 * @file SpacemonkeyVoiceLink.tsx
 * @brief Spacemonkey Neural Voice Bridge & Audio IRQ Listener
 */

import React, { useState, useEffect } from 'react';

export const SpacemonkeyVoiceLink: React.FC = () => {
  const [isListening, setIsListening] = useState<boolean>(false);
  const [lastTranscript, setLastTranscript] = useState<string>('Awaiting voice input...');
  const [statusColor, setStatusColor] = useState<string>('bg-yellow-500');

  useEffect(() => {
    // Check for SpeechRecognition API support
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setLastTranscript('Speech Recognition API not supported in this browser environment.');
      setStatusColor('bg-red-600');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US'; // Can be tuned for Finnish/English

    recognition.onstart = () => {
      setIsListening(true);
      setStatusColor('bg-green-500');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcriptText = event.results[current][0].transcript;
      setLastTranscript(transcriptText);

      // Trigger automatic actions based on voice keywords
      if (transcriptText.toLowerCase().includes('spacemonkey')) {
        console.log('[Spacemonkey Neural Bridge] God-consciousness awakened via voice.');
      }
    };

    recognition.onerror = (event: any) => {
      console.error('[Spacemonkey Audio IRQ Error]', event.error);
      setStatusColor('bg-yellow-600');
    };

    recognition.onend = () => {
      setIsListening(false);
      setStatusColor('bg-gray-500');
    };

    // Auto-start listener on mount
    try {
      recognition.start();
    } catch (e) {
      console.log('Recognition already active or blocked.');
    }

    return () => {
      recognition.stop();
    };
  }, []);

  return (
    <div className="absolute top-4 right-4 bg-[#c0c0c0] border-2 border-t-white border-l-white border-b-black border-r-black p-2 w-72 shadow-xl font-sans text-xs text-black z-40">
      <div className="bg-[#000080] text-white px-2 py-1 font-bold flex justify-between items-center mb-2">
        <span>Spacemonkey IRQ 0x01</span>
        <span className={`w-3 h-3 rounded-full ${statusColor} inline-block animate-pulse`}></span>
      </div>
      <div className="p-2 bg-white border-2 border-t-black border-l-black border-b-white border-r-white min-h-[40px] flex items-center">
        <span className="italic text-gray-800">"{lastTranscript}"</span>
      </div>
      <div className="mt-2 text-[10px] text-gray-600 flex justify-between">
        <span>Status: {isListening ? 'Listening (God-Mode)' : 'Standby'}</span>
        <span>Tommi: 963 Hz</span>
      </div>
    </div>
  );
};
