import { useState, useRef, useCallback, useEffect } from 'react';
import { Room, RoomEvent, LocalAudioTrack, RemoteAudioTrack } from 'livekit-client';

interface LiveKitVoiceChatConfig {
  language?: string;
  continuousMode?: boolean;
  autoSpeak?: boolean;
  speechRate?: number;
  speechPitch?: number;
  voiceId?: string;
}

interface LiveKitVoiceChatState {
  isListening: boolean;
  isProcessing: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  isConnected: boolean;
  isSupported: boolean;
  transcript: string;
  error: string | null;
}

export const useLiveKitVoiceChat = (config: LiveKitVoiceChatConfig = {}) => {
  const {
    language = 'en-IN',
    continuousMode = false,
    autoSpeak = true,
    speechRate = 0.85,
    speechPitch = 0.9,
    voiceId = 'indian-male-1' // LiveKit voice ID for Indian male voice
  } = config;

  // State management
  const [state, setState] = useState<LiveKitVoiceChatState>({
    isListening: false,
    isProcessing: false,
    isSpeaking: false,
    isMuted: false,
    isConnected: false,
    isSupported: typeof window !== 'undefined' && 
      'MediaDevices' in window && 
      'getUserMedia' in window.navigator.mediaDevices,
    transcript: '',
    error: null
  });

  // Refs for managing instances
  const roomRef = useRef<Room | null>(null);
  const audioTrackRef = useRef<LocalAudioTrack | null>(null);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastSpokenTextRef = useRef<string>('');

  // Initialize LiveKit room
  const initializeRoom = useCallback(async () => {
    if (!state.isSupported) return null;

    try {
      const room = new Room();
      
      // Handle room events
      room.on(RoomEvent.Connected, () => {
        console.log('LiveKit: Connected to room');
        setState(prev => ({ ...prev, isConnected: true, error: null }));
      });

      room.on(RoomEvent.Disconnected, () => {
        console.log('LiveKit: Disconnected from room');
        setState(prev => ({ ...prev, isConnected: false }));
      });

      room.on(RoomEvent.AudioPlaybackStatusChanged, (canPlayback) => {
        console.log('LiveKit: Audio playback status changed:', canPlayback);
      });

      room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
        if (track.kind === 'audio') {
          console.log('LiveKit: Audio track subscribed from', participant.identity);
          const audioElement = track.attach();
          document.body.appendChild(audioElement);
          
          // Handle realistic voice output
          setState(prev => ({ ...prev, isSpeaking: true }));
          
          track.addListener('ended', () => {
            setState(prev => ({ ...prev, isSpeaking: false }));
            audioElement.remove();
          });
        }
      });

      roomRef.current = room;
      return room;
    } catch (error) {
      console.error('LiveKit: Failed to initialize room:', error);
      setState(prev => ({ ...prev, error: 'Failed to initialize voice room' }));
      return null;
    }
  }, [state.isSupported]);

  // Connect to LiveKit room with token
  const connectToRoom = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'LiveKit not supported in this browser' }));
      return false;
    }

    try {
      const room = await initializeRoom();
      if (!room) return false;

      // For demo purposes, using a mock token - in production, get this from your backend
      const token = await generateAccessToken();
      const wsUrl = 'wss://your-livekit-server.com'; // Replace with your LiveKit server URL
      
      await room.connect(wsUrl, token);
      
      return true;
    } catch (error) {
      console.error('LiveKit: Connection failed:', error);
      setState(prev => ({ 
        ...prev, 
        error: 'Failed to connect to voice service. Using fallback speech recognition.' 
      }));
      return false;
    }
  }, [initializeRoom, state.isSupported]);

  // Generate access token (in production, this should be done on your backend)
  const generateAccessToken = async (): Promise<string> => {
    // Mock token for demo - replace with actual API call to your backend
    return 'mock-access-token';
  };

  // Start listening with LiveKit or fallback to Web Speech API
  const startListening = useCallback(async () => {
    if (!state.isSupported) {
      setState(prev => ({ ...prev, error: 'Voice input not supported in this browser' }));
      return;
    }

    // Stop any ongoing speech
    if (synthRef.current) {
      window.speechSynthesis.cancel();
      setState(prev => ({ ...prev, isSpeaking: false }));
    }

    try {
      // Try LiveKit first
      if (!state.isConnected) {
        const connected = await connectToRoom();
        if (!connected) {
          // Fallback to Web Speech API
          startWebSpeechRecognition();
          return;
        }
      }

      // Start LiveKit audio capture
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 1
        }
      });
      const audioTrack = new LocalAudioTrack(stream.getAudioTracks()[0]);

      if (roomRef.current) {
        await roomRef.current.localParticipant.publishTrack(audioTrack);
        audioTrackRef.current = audioTrack;
        setState(prev => ({ ...prev, isListening: true, transcript: '', error: null }));
      }

    } catch (error) {
      console.error('LiveKit: Failed to start listening:', error);
      // Fallback to Web Speech API
      startWebSpeechRecognition();
    }
  }, [state.isSupported, state.isConnected, connectToRoom]);

  // Fallback Web Speech API recognition
  const startWebSpeechRecognition = useCallback(() => {
    console.log('Using Web Speech API fallback');
    
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setState(prev => ({ ...prev, error: 'Speech recognition not supported' }));
      return;
    }

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
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [language, continuousMode]);

  // Stop listening
  const stopListening = useCallback(() => {
    if (audioTrackRef.current && roomRef.current) {
      // Stop LiveKit audio track
      roomRef.current.localParticipant.unpublishTrack(audioTrackRef.current);
      audioTrackRef.current.stop();
      audioTrackRef.current = null;
    }
    
    if (recognitionRef.current) {
      // Stop Web Speech API
      recognitionRef.current.stop();
    }
    
    setState(prev => ({ ...prev, isListening: false, isProcessing: false }));
  }, []);

  // Enhanced realistic speech with Indian voice preference
  const speak = useCallback((text: string) => {
    if (!state.isSupported || state.isMuted || !text.trim()) return;

    // Prevent speaking the same text repeatedly
    if (lastSpokenTextRef.current === text.trim()) {
      console.log('Skipping repeated text:', text);
      return;
    }

    // Cancel any ongoing speech
    window.speechSynthesis.cancel();

    // Wait for speech synthesis to be ready
    setTimeout(() => {
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Enhanced settings for more natural Indian voice
      utterance.rate = 0.8;  // Slightly slower for clarity
      utterance.pitch = 0.85; // Natural pitch
      utterance.volume = 1.0;

      // Get available voices and prefer high-quality Indian voices
      const voices = window.speechSynthesis.getVoices();
      console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang, quality: v.localService })));

      // Enhanced voice selection with quality preference
      const preferredVoice = voices.find(voice => 
        (voice.lang.includes('en-IN') || voice.name.toLowerCase().includes('indian')) &&
        voice.localService // Prefer local/offline voices for better quality
      ) || voices.find(voice => 
        voice.lang.includes('en-IN') || 
        voice.name.toLowerCase().includes('indian') ||
        voice.name.toLowerCase().includes('ravi') ||
        voice.name.toLowerCase().includes('veena') ||
        voice.name.toLowerCase().includes('aditi') ||
        voice.name.toLowerCase().includes('priya')
      );

      // High-quality fallback voices
      const fallbackVoice = voices.find(voice => 
        (voice.name.toLowerCase().includes('enhanced') ||
        voice.name.toLowerCase().includes('premium') ||
        voice.name.toLowerCase().includes('neural') ||
        voice.name.toLowerCase().includes('wavenet')) &&
        voice.lang.includes('en')
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
        console.log('Using preferred Indian voice:', preferredVoice.name, preferredVoice.lang);
      } else if (fallbackVoice) {
        utterance.voice = fallbackVoice;
        console.log('Using high-quality fallback voice:', fallbackVoice.name, fallbackVoice.lang);
      }

      utterance.onstart = () => {
        setState(prev => ({ ...prev, isSpeaking: true }));
        lastSpokenTextRef.current = text.trim();
        console.log('Started speaking with enhanced voice:', text.substring(0, 50) + '...');
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
        console.error('Enhanced speech synthesis error:', error);
        setState(prev => ({ ...prev, isSpeaking: false }));
      };

      synthRef.current = utterance;
      window.speechSynthesis.speak(utterance);
    }, 100);

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
        const voices = window.speechSynthesis.getVoices();
        if (voices.length === 0) {
          window.speechSynthesis.addEventListener('voiceschanged', () => {
            const loadedVoices = window.speechSynthesis.getVoices();
            console.log('Enhanced voices loaded:', loadedVoices.length);
          });
        }
      }
    };

    initializeVoices();

    return () => {
      if (roomRef.current) {
        roomRef.current.disconnect();
      }
      if (audioTrackRef.current) {
        audioTrackRef.current.stop();
      }
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