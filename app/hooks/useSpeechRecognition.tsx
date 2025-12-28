"use client";

import { useState, useEffect, useRef } from 'react';

// 1. Define the shape of the Speech API objects
// We manually describe what the browser gives us so we don't need 'any'
interface SpeechRecognitionEvent {
  results: {
    [index: number]: {
      [index: number]: {
        transcript: string;
      };
    };
  };
}

interface SpeechRecognitionErrorEvent {
  error: string;
  message: string;
}

// 2. Define the SpeechRecognition Class Interface
interface ISpeechRecognition {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onend: () => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
}

// 3. Extend Window to include the constructor
interface IWindow extends Window {
  webkitSpeechRecognition: new () => ISpeechRecognition; // It's a class constructor
}

export default function useSpeechRecognition() {
  const [text, setText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [hasSupport, setHasSupport] = useState<boolean>(false);

  // We type the Ref to hold our specific Interface or null
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Type casting window to our custom interface
    const { webkitSpeechRecognition } = window as unknown as IWindow;

    if (!webkitSpeechRecognition) {
      console.error("Browser does not support speech recognition.");
      setHasSupport(false);
      return;
    }

    setHasSupport(true);

    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = true;

    // Now 'event' is properly typed! No red lines.
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      setText(transcript);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) recognitionRef.current.stop();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      try {
        setText("");
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech:", error);
      }
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  return { 
    text, 
    isListening, 
    startListening, 
    stopListening, 
    hasSupport 
  };
}