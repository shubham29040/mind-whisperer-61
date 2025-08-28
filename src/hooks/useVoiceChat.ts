import { useState, useRef, useCallback, useEffect } from 'react';

// Type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  grammars: any; // SpeechGrammarList - simplified
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  serviceURI: string;
  start(): void;
  stop(): void;
  abort(): void;
  onaudiostart: (event: Event) => void;
  onaudioend: (event: Event) => void;
  onend: (event: Event) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onnomatch: (event: SpeechRecognitionEvent) => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onsoundstart: (event: Event) => void;
  onsoundend: (event: Event) => void;
  onspeechstart: (event: Event) => void;
  onspeechend: (event: Event) => void;
  onstart: (event: Event) => void;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  readonly length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

declare var SpeechRecognition: {
  prototype: SpeechRecognition;
  new (): SpeechRecognition;
};

interface VoiceChatConfig {
  language?: string;
  continuousMode?: boolean;
  autoSpeak?: boolean;
  speechRate?: number;
  speechPitch?: number;
}

interface VoiceChatState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
}

export const useVoiceChat = (config: VoiceChatConfig = {}) => {
  const {
    language = 'en-US',
    continuousMode = false,
    autoSpeak = true,
    speechRate = 1,
    speechPitch = 1
  } = config;

  // State management
  const [state, setState] = useState<VoiceChatState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    isMuted: false,
    isSupported: typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
      'speechSynthesis' in window,
    transcript: '',
    error: null
  });

  // Refs for managing instances
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize speech recognition
  const initializeRecognition = useCallback(() => {
    if (!state.isSupported) return null;

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = language;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setState(prev => ({ ...prev, isListening: true, error: null }));
    };

    recognition.onresult = (event) => {
      let finalTranscript = '';
      let interimTranscript = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      setState(prev => ({
        ...prev,
        transcript: finalTranscript || interimTranscript,
        isProcessing: !!finalTranscript
      }));

      // Auto-stop after final result
      if (finalTranscript && !continuousMode) {
        recognition.stop();
      }
    };

    recognition.onerror = (event) => {
      let errorMessage = 'Speech recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'No speech detected. Please try again.';
          break;
        case 'audio-capture':
          errorMessage = 'Microphone not accessible. Please check permissions.';
          break;
        case 'not-allowed':
          errorMessage = 'Microphone access denied. Please allow microphone access.';
          break;
        case 'network':
          errorMessage = 'Network error. Please check your connection.';
          break;
        default:
          errorMessage = `Speech recognition error: ${event.error}`;
      }

      setState(prev => ({
        ...prev,
        isListening: false,
        isProcessing: false,
        error: errorMessage
      }));
    };

    recognition.onend = () => {
      setState(prev => ({
        ...prev,
        isListening: false,
        isProcessing: false
      }));

      // Clear timeout if exists
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };

    return recognition;
  }, [language, continuousMode, state.isSupported]);

  // Start listening
  const startListening = useCallback(() => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported in this browser' }));
      return;
    }

    // Stop any ongoing speech
    if (synthRef.current) {
      window.speechSynthesis.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      recognitionRef.current = initializeRecognition();
      if (recognitionRef.current) {
        setState(prev => ({ ...prev, transcript: '', error: null }));
        recognitionRef.current.start();
      }
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to start speech recognition. Please try again.' 
      }));
    }
  }, [state.isSupported, initializeRecognition]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setState(prev => ({ ...prev, isListening: false, isProcessing: false }));
  }, []);

  // Speak text
  const speak = useCallback((text: string) => {
    if (!state.isSupported || state.isMuted || !text.trim()) return;

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = speechRate;
    utterance.pitch = speechPitch;
    utterance.volume = 1;

    // Try to use Hindi voice if language contains 'hi'
    if (language.includes('hi')) {
      const voices = window.speechSynthesis.getVoices();
      const hindiVoice = voices.find(voice => 
        voice.lang.includes('hi') || voice.name.includes('Hindi')
      );
      if (hindiVoice) {
        utterance.voice = hindiVoice;
      }
    }

    utterance.onstart = () => {
      setState(prev => ({ ...prev, isSpeaking: true }));
    };

    utterance.onend = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
      
      // Auto restart listening in continuous mode
      if (continuousMode && !state.isListening) {
        timeoutRef.current = setTimeout(() => {
          startListening();
        }, 1000);
      }
    };

    utterance.onerror = () => {
      setState(prev => ({ ...prev, isSpeaking: false }));
    };

    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [state.isSupported, state.isMuted, state.isListening, speechRate, speechPitch, language, continuousMode, startListening]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setState(prev => ({ ...prev, isSpeaking: false }));
  }, []);

  // Toggle mute
  const toggleMute = useCallback(() => {
    setState(prev => ({ ...prev, isMuted: !prev.isMuted }));
    if (!state.isMuted) {
      stopSpeaking();
    }
  }, [state.isMuted, stopSpeaking]);

  // Clear error
  const clearError = useCallback(() => {
    setState(prev => ({ ...prev, error: null }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        window.speechSynthesis.cancel();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Auto-speak when enabled
  const handleAutoSpeak = useCallback((text: string) => {
    if (autoSpeak && text) {
      speak(text);
    }
  }, [autoSpeak, speak]);

  return {
    // State
    ...state,
    
    // Actions
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    toggleMute,
    clearError,
    handleAutoSpeak,
    
    // Utils
    isVoiceAvailable: state.isSupported
  };
};