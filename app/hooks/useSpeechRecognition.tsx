"use client";

import { useState, useEffect, useRef } from 'react';

// 1. Define the shape of the Speech API objects
// We manually describe what the browser gives us so we don't need 'any'
interface SpeechRecognitionResult {
  [index: number]: {
    transcript: string;
    confidence?: number;
  };
  isFinal?: boolean;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult | null;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionEvent {
  results: SpeechRecognitionResultList;
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
  webkitSpeechRecognition?: new () => ISpeechRecognition; // It's a class constructor
  SpeechRecognition?: new () => ISpeechRecognition; // Standard API (Firefox, etc.)
}

export default function useSpeechRecognition() {
  const [text, setText] = useState<string>("");
  const [isListening, setIsListening] = useState<boolean>(false);
  const [hasSupport, setHasSupport] = useState<boolean>(false);

  // We type the Ref to hold our specific Interface or null
  const recognitionRef = useRef<ISpeechRecognition | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Check for both webkit and standard SpeechRecognition
    const win = window as unknown as IWindow;
    const SpeechRecognition = win.webkitSpeechRecognition || win.SpeechRecognition;

    if (!SpeechRecognition) {
      console.warn("Browser does not support speech recognition.");
      setHasSupport(false);
      return;
    }

    setHasSupport(true);

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.lang = navigator.language || 'en-US';
      recognition.interimResults = true;

      // Handle both interim and final results
      recognition.onresult = (event: SpeechRecognitionEvent) => {
        let finalTranscript = '';
        
        // Iterate through all results to build the complete transcript
        // The results structure: event.results[i][0].transcript
        for (let i = 0; i < event.results.length; i++) {
          const result = event.results[i];
          // Each result can have multiple alternatives, we take the first one [0]
          if (result && result[0] && result[0].transcript) {
            finalTranscript += result[0].transcript + ' ';
          }
        }
        
        // Update text with the complete transcript (trim to remove trailing space)
        if (finalTranscript.trim()) {
          setText(finalTranscript.trim());
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        console.log("🎤 Speech recognition ended");
      };

      recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
        setIsListening(false);
        // Common errors:
        // - "no-speech": User didn't speak (not an error, just no input)
        // - "aborted": Recognition was stopped (normal)
        // - "audio-capture": No microphone found
        // - "network": Network error
        // - "not-allowed": Permission denied (user needs to grant permission)
        
        // Only log actual errors, not expected permission/user actions
        if (event.error === "not-allowed") {
          // Permission denied - this is expected if user hasn't granted permission yet
          // Don't log as error, just silently handle
          return;
        } else if (event.error === "no-speech" || event.error === "aborted") {
          // These are normal - user didn't speak or stopped manually
          return;
        } else {
          // Log other errors (network, audio-capture, etc.)
          console.warn("Speech recognition error:", event.error, event.message || "");
        }
      };

      recognitionRef.current = recognition;
    } catch (error) {
      console.error("Failed to initialize speech recognition:", error);
      setHasSupport(false);
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {
          // Ignore errors during cleanup
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startListening = () => {
    if (!recognitionRef.current) {
      console.warn("Speech recognition not available");
      alert("Speech recognition is not supported in your browser. Please use Chrome or Edge.");
      return;
    }

    try {
      // Clear previous text
      setText("");
      // Start recognition
      recognitionRef.current.start();
      setIsListening(true);
      console.log("🎤 Speech recognition started");
    } catch (error: any) {
      console.error("Error starting speech:", error);
      setIsListening(false);
      // Handle specific errors
      if (error?.name === "NotAllowedError" || error?.message?.includes("permission") || error?.code === 1) {
        alert("Microphone permission denied. Please allow microphone access in your browser settings and try again.");
      } else if (error?.name === "NotFoundError" || error?.message?.includes("microphone") || error?.code === 2) {
        alert("No microphone found. Please connect a microphone and try again.");
      } else if (error?.message?.includes("already started") || error?.code === 0) {
        // Recognition already started, just update state
        setIsListening(true);
      } else {
        alert(`Failed to start speech recognition: ${error?.message || "Unknown error"}`);
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