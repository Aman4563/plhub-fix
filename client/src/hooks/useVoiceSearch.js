import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for voice search using Web Speech API
 */
const useVoiceSearch = (onResult) => {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const recognitionRef = useRef(null);

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognition) {
      setIsSupported(true);
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (onResult) {
          onResult(transcript);
        }
        setIsListening(false);
      };

      recognitionRef.current.onerror = (event) => {
        setError(event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setIsSupported(false);
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [onResult]);

  const startListening = useCallback(() => {
    if (!isSupported || !recognitionRef.current) {
      setError('Voice search is not supported in your browser');
      return;
    }

    setError(null);
    setIsListening(true);
    
    try {
      recognitionRef.current.start();
    } catch (e) {
      if (e.message.includes('already started')) {
        recognitionRef.current.stop();
        setTimeout(() => {
          recognitionRef.current.start();
        }, 100);
      } else {
        setError(e.message);
        setIsListening(false);
      }
    }
  }, [isSupported]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  }, []);

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
  };
};

export default useVoiceSearch;

