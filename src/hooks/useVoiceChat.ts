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

  // Track last spoken text to prevent repetition
  const lastSpokenTextRef = useRef<string>('');
  const speakTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Speak text with Indian voice preference and repetition prevention
  const speak = useCallback((text: string) => {
    if (!state.isSupported || state.isMuted || !text.trim()) return;

    // Prevent speaking the same text repeatedly
    if (lastSpokenTextRef.current === text.trim()) {
      console.log('Skipping repeated text:', text);
      return;
    }

    // Clear any pending speak timeout
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Wait a bit for speech synthesis to be ready
    speakTimeoutRef.current = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // More natural speech settings for Indian context
      utterance.rate = 0.85; // Slightly slower for clarity
      utterance.pitch = 0.9; // Slightly lower pitch for natural sound
      utterance.volume = 0.9;

      // Get available voices and prefer Indian/Hindi voices
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));

      // Prioritize Indian English and Hindi voices
      const preferredVoice = voices.find(voice => 
        voice.lang.includes('en-IN') || // Indian English
        voice.name.toLowerCase().includes('indian') ||
        voice.name.toLowerCase().includes('ravi') || // Common Indian voice names
        voice.name.toLowerCase().includes('veena') ||
        voice.lang.includes('hi-IN') || // Hindi India
        voice.lang.includes('hi') // General Hindi
      );

      // Fallback to other natural voices
      const fallbackVoice = voices.find(voice => 
        voice.name.toLowerCase().includes('natural') ||
        voice.name.toLowerCase().includes('enhanced') ||
        voice.name.toLowerCase().includes('premium') ||
        (voice.lang.includes('en') && voice.localService) // Local English voices
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('Using preferred voice:', preferredVoice.name, preferredVoice.lang);
      } else if (fallbackVoice) {
        utterance.voice = fallbackVoice;
        console.log('Using fallback voice:', fallbackVoice.name, fallbackVoice.lang);
      }

      utterance.onstart = () => {
        setState(prev => ({ ...prev, isSpeaking: true }));
        lastSpokenTextRef.current = text.trim();
        console.log('Started speaking:', text.substring(0, 50) + '...');
      };

      utterance.onend = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        console.log('Finished speaking');
        
        // Auto restart listening in continuous mode
        if (continuousMode && !state.isListening) {
          timeoutRef.current = setTimeout(() => {
            startListening();
          }, 1500);
        }
      };

      utterance.onerror = (error) => {
        console.error('Speech synthesis error:', error);
        setState(prev => ({ ...prev, isSpeaking: false }));
      };

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 100); // Small delay to ensure speech synthesis is ready

  }, [state.isSupported, state.isMuted, state.isListening, continuousMode, startListening]);

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
    // Initialize voices when component mounts
    const initializeVoices = () => {
      if ('speechSynthesis' in window) {
        // Load voices if not already loaded
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          // Wait for voices to load
          window.speechSynthesis.addEventListener('voiceschanged', () => {
            const loadedVoices = window.speechSynthesis.getVoices();
            console.log('Voices loaded:', loadedVoices.length);
          });
        }
      }
    };

    initializeVoices();

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
      if (speakTimeoutRef.current) {
        clearTimeout(speakTimeoutRef.current);
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