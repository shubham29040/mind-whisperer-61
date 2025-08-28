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
  grammars: any;
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

interface EnhancedVoiceChatConfig {
  language?: string;
  continuousMode?: boolean;
  autoSpeak?: boolean;
  speechRate?: number;
  speechPitch?: number;
  volume?: number;
}

interface EnhancedVoiceChatState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
  selectedVoice: string | null;
}

export const useEnhancedVoiceChat = (config: EnhancedVoiceChatConfig = {}) => {
  const {
    language = 'en-IN',
    continuousMode = false,
    autoSpeak = true,
    speechRate = 0.75,
    speechPitch = 0.8,
    volume = 1.0
  } = config;

  // State management
  const [state, setState] = useState<EnhancedVoiceChatState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    isMuted: false,
    isSupported: typeof window !== 'undefined' && 
      ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) &&
      'speechSynthesis' in window,
    transcript: '',
    error: null,
    selectedVoice: null
  });

  // Refs for managing instances
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenTextRef = useRef<string>('');
  const speakTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Enhanced voice selection for realistic Indian voices
  const selectBestVoice = useCallback((): SpeechSynthesisVoice | null => {
    const voices = window.speechSynthesis.getVoices();
    
    // Priority 1: High-quality Indian English voices
    const premiumIndianVoices = voices.filter(voice => 
      (voice.lang.includes('en-IN') || voice.name.toLowerCase().includes('indian')) &&
      (voice.name.toLowerCase().includes('premium') ||
       voice.name.toLowerCase().includes('enhanced') ||
       voice.name.toLowerCase().includes('neural') ||
       voice.name.toLowerCase().includes('wavenet') ||
       voice.localService)
    );

    if (premiumIndianVoices.length > 0) {
      console.log('Selected premium Indian voice:', premiumIndianVoices[0].name);
      return premiumIndianVoices[0];
    }

    // Priority 2: Standard Indian English voices
    const indianVoices = voices.filter(voice => 
      voice.lang.includes('en-IN') || 
      voice.name.toLowerCase().includes('indian') ||
      voice.name.toLowerCase().includes('ravi') ||
      voice.name.toLowerCase().includes('veena') ||
      voice.name.toLowerCase().includes('aditi') ||
      voice.name.toLowerCase().includes('priya') ||
      voice.name.toLowerCase().includes('kendra') ||
      voice.name.toLowerCase().includes('joanna')
    );

    if (indianVoices.length > 0) {
      console.log('Selected Indian voice:', indianVoices[0].name);
      return indianVoices[0];
    }

    // Priority 3: High-quality English voices
    const premiumEnglishVoices = voices.filter(voice => 
      voice.lang.includes('en') &&
      (voice.name.toLowerCase().includes('premium') ||
       voice.name.toLowerCase().includes('enhanced') ||
       voice.name.toLowerCase().includes('neural') ||
       voice.name.toLowerCase().includes('natural') ||
       voice.localService)
    );

    if (premiumEnglishVoices.length > 0) {
      console.log('Selected premium English voice:', premiumEnglishVoices[0].name);
      return premiumEnglishVoices[0];
    }

    // Priority 4: Any good English voice
    const englishVoices = voices.filter(voice => 
      voice.lang.includes('en') && !voice.name.toLowerCase().includes('google')
    );

    if (englishVoices.length > 0) {
      console.log('Selected English voice:', englishVoices[0].name);
      return englishVoices[0];
    }

    return null;
  }, []);

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
      console.log('Enhanced voice recognition started');
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
      let errorMessage = 'Voice recognition error';
      
      switch (event.error) {
        case 'no-speech':
          errorMessage = 'कोई आवाज़ नहीं सुनाई दी। फिर से कोशिश करें।';
          break;
        case 'audio-capture':
          errorMessage = 'माइक्रोफ़ोन एक्सेस नहीं मिल सका। अनुमति चेक करें।';
          break;
        case 'not-allowed':
          errorMessage = 'माइक्रोफ़ोन की अनुमति नहीं दी गई। कृपया अनुमति दें।';
          break;
        case 'network':
          errorMessage = 'नेटवर्क की समस्या। कनेक्शन चेक करें।';
          break;
        default:
          errorMessage = `Voice error: ${event.error}`;
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
      setState(prev => ({ ...prev, error: 'Voice features not supported in this browser' }));
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
        error: 'Failed to start voice recognition. Try again.' 
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

  // Enhanced realistic speech with natural Indian voice
  const speak = useCallback((text: string) => {
    if (!state.isSupported || state.isMuted || !text.trim()) return;

    // Prevent speaking the same text repeatedly
    if (lastSpokenTextRef.current === text.trim()) {
      console.log('Preventing repeated speech:', text.substring(0, 30) + '...');
      return;
    }

    // Clear any pending speak timeout
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Small delay to ensure speech synthesis is ready
    speakTimeoutRef.current = setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Ultra-natural settings for realistic Indian voice
      utterance.rate = speechRate;    // Slower for natural clarity
      utterance.pitch = speechPitch;  // Lower pitch for warmth
      utterance.volume = volume;      // Full volume

      // Select the best available voice
      const bestVoice = selectBestVoice();
      if (bestVoice) {
        utterance.voice = bestVoice;
        setState(prev => ({ ...prev, selectedVoice: bestVoice.name }));
        console.log('Using ultra-realistic voice:', bestVoice.name, bestVoice.lang);
      }

      utterance.onstart = () => {
        setState(prev => ({ ...prev, isSpeaking: true }));
        lastSpokenTextRef.current = text.trim();
        console.log('Started ultra-realistic speech:', text.substring(0, 50) + '...');
      };

      utterance.onend = () => {
        setState(prev => ({ ...prev, isSpeaking: false }));
        console.log('Finished ultra-realistic speech');
        
        // Auto restart listening in continuous mode
        if (continuousMode && !state.isListening) {
          timeoutRef.current = setTimeout(() => {
            startListening();
          }, 1500);
        }
      };

      utterance.onerror = (error) => {
        console.error('Ultra-realistic speech error:', error);
        setState(prev => ({ ...prev, isSpeaking: false }));
      };

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 100);

  }, [state.isSupported, state.isMuted, state.isListening, continuousMode, startListening, speechRate, speechPitch, volume, selectBestVoice]);

  // Stop speaking
  const stopSpeaking = useCallback(() => {
    window.speechSynthesis.cancel();
    setState(prev => ({ ...prev, isSpeaking: false }));
    if (speakTimeoutRef.current) {
      clearTimeout(speakTimeoutRef.current);
      speakTimeoutRef.current = null;
    }
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

  // Auto-speak when enabled
  const handleAutoSpeak = useCallback((text: string) => {
    if (autoSpeak && text) {
      speak(text);
    }
  }, [autoSpeak, speak]);

  // Initialize voices and cleanup on unmount
  useEffect(() => {
    const initializeVoices = () => {
      if ('speechSynthesis' in window) {
        // Load voices if not already loaded
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          // Wait for voices to load
          const handleVoicesChanged = () => {
            const loadedVoices = window.speechSynthesis.getVoices();
            console.log('Ultra-realistic voices loaded:', loadedVoices.length);
            // Try to select the best voice immediately
            const bestVoice = selectBestVoice();
            if (bestVoice) {
              setState(prev => ({ ...prev, selectedVoice: bestVoice.name }));
            }
          };
          
          window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);
          
          // Clean up event listener
          return () => {
            window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
          };
        } else {
          // Voices already available
          const bestVoice = selectBestVoice();
          if (bestVoice) {
            setState(prev => ({ ...prev, selectedVoice: bestVoice.name }));
          }
        }
      }
    };

    const cleanup = initializeVoices();

    return () => {
      cleanup?.();
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
  }, [selectBestVoice]);

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