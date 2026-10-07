import { useState, useEffect, useRef, useCallback } from 'react';
import { ActiveTab } from '../types';
import { saveVoiceFieldNote, VoiceNoteRecord } from '../utils/offlineStorage';

interface UseVoiceNavigationProps {
  activeTab: ActiveTab;
  onNavigate: (tab: ActiveTab) => void;
  onStartTour?: () => void;
  onToggleDarkMode?: () => void;
  onOpenDownload?: () => void;
}

export interface VoiceNavigationState {
  isSupported: boolean;
  isListening: boolean;
  transcript: string;
  feedback: string;
  isRecordingVoiceNote: boolean;
  activeNoteDuration: number;
  lastCommand: string | null;
  startListening: () => void;
  stopListening: () => void;
  toggleListening: () => void;
  startVoiceNoteRecording: () => void;
  stopVoiceNoteRecording: () => Promise<VoiceNoteRecord | null>;
}

export function useVoiceNavigation({
  activeTab,
  onNavigate,
  onStartTour,
  onToggleDarkMode,
  onOpenDownload,
}: UseVoiceNavigationProps): VoiceNavigationState {
  const [isSupported, setIsSupported] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [feedback, setFeedback] = useState('');
  const [lastCommand, setLastCommand] = useState<string | null>(null);
  const [isRecordingVoiceNote, setIsRecordingVoiceNote] = useState(false);
  const [activeNoteDuration, setActiveNoteDuration] = useState(0);

  const recognitionRef = useRef<any>(null);
  const recordingTimerRef = useRef<any>(null);
  const activeNoteTranscriptRef = useRef<string>('');

  // Speech synthesis confirmation helper
  const speakFeedback = useCallback((text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        // speech synthesis optional
      }
    }
  }, []);

  // Parse and execute hands-free commands
  const processCommand = useCallback(
    async (phrase: string) => {
      const lower = phrase.toLowerCase().trim();
      setTranscript(phrase);

      // If currently recording a voice note for field logging, accumulate transcript
      if (isRecordingVoiceNote) {
        activeNoteTranscriptRef.current += ' ' + phrase;
        if (lower.includes('stop recording') || lower.includes('save note') || lower.includes('end note')) {
          await stopVoiceNoteRecording();
          return;
        }
      }

      // Voice Navigation Commands
      if (
        lower.includes('dashboard') ||
        lower.includes('executive') ||
        lower.includes('home') ||
        lower.includes('overview')
      ) {
        setLastCommand('Navigating to Executive Dashboard');
        setFeedback('Switched to Executive Dashboard');
        speakFeedback('Opening Dashboard');
        onNavigate('dashboard');
        return;
      }

      if (
        lower.includes('vision') ||
        lower.includes('computer vision') ||
        lower.includes('core logging') ||
        lower.includes('inspect core') ||
        lower.includes('rock vision') ||
        lower.includes('hyperspectral')
      ) {
        setLastCommand('Navigating to Computer Vision');
        setFeedback('Switched to Computer Vision & Core Analysis');
        speakFeedback('Opening Computer Vision');
        onNavigate('vision');
        return;
      }

      if (
        lower.includes('map') ||
        lower.includes('gis') ||
        lower.includes('exploration map') ||
        lower.includes('targets') ||
        lower.includes('geology map')
      ) {
        setLastCommand('Navigating to Exploration GIS Map');
        setFeedback('Switched to GIS Exploration Map');
        speakFeedback('Opening Exploration Map');
        onNavigate('gis_map');
        return;
      }

      if (
        lower.includes('mineral') ||
        lower.includes('minerals') ||
        lower.includes('database') ||
        lower.includes('petrography')
      ) {
        setLastCommand('Navigating to Mineral Database');
        setFeedback('Switched to Mineral & Petrography Database');
        speakFeedback('Opening Mineral Database');
        onNavigate('minerals');
        return;
      }

      if (
        lower.includes('geochem') ||
        lower.includes('geochemistry') ||
        lower.includes('geophysics') ||
        lower.includes('pathfinder') ||
        lower.includes('assays')
      ) {
        setLastCommand('Navigating to Geochemistry & Geophysics');
        setFeedback('Switched to Geochemistry & Geophysics');
        speakFeedback('Opening Geochemistry Analyzer');
        onNavigate('geochemistry');
        return;
      }

      if (
        lower.includes('drill') ||
        lower.includes('drillhole') ||
        lower.includes('drillholes') ||
        lower.includes('drill hole') ||
        lower.includes('core log') ||
        lower.includes('intercepts')
      ) {
        setLastCommand('Navigating to Drillhole Manager');
        setFeedback('Switched to Drillhole Manager');
        speakFeedback('Opening Drillhole Manager');
        onNavigate('drillholes');
        return;
      }

      if (
        lower.includes('economic') ||
        lower.includes('economics') ||
        lower.includes('calculator') ||
        lower.includes('pea') ||
        lower.includes('cash flow')
      ) {
        setLastCommand('Navigating to Mining Economics');
        setFeedback('Switched to Mining Economics Calculator');
        speakFeedback('Opening Mining Economics');
        onNavigate('economics');
        return;
      }

      if (
        lower.includes('health') ||
        lower.includes('healthcare') ||
        lower.includes('safety') ||
        lower.includes('vitals') ||
        lower.includes('esg') ||
        lower.includes('miner')
      ) {
        setLastCommand('Navigating to Miner Healthcare & ESG');
        setFeedback('Switched to Miner Healthcare & ESG');
        speakFeedback('Opening Miner Safety and Healthcare');
        onNavigate('healthcare_esg');
        return;
      }

      if (
        lower.includes('judge') ||
        lower.includes('judge agent') ||
        lower.includes('a2a') ||
        lower.includes('self maintenance') ||
        lower.includes('audit')
      ) {
        setLastCommand('Navigating to A2A Judge Agent');
        setFeedback('Switched to A2A Judge Agent Center');
        speakFeedback('Opening A2A Judge Agent');
        onNavigate('a2a_judge');
        return;
      }

      if (
        lower.includes('assistant') ||
        lower.includes('mine ai') ||
        lower.includes('copilot') ||
        lower.includes('help')
      ) {
        setLastCommand('Navigating to MineAI Assistant');
        setFeedback('Switched to MineAI Copilot');
        speakFeedback('Opening MineAI Assistant');
        onNavigate('assistant');
        return;
      }

      // Operational Actions
      if (lower.includes('start tour') || lower.includes('launch tour') || lower.includes('guided tour')) {
        setLastCommand('Launching Interactive Tour');
        setFeedback('Launching Platform Tour');
        speakFeedback('Starting Interactive Tour');
        if (onStartTour) onStartTour();
        return;
      }

      if (lower.includes('download') || lower.includes('mobile app') || lower.includes('install app')) {
        setLastCommand('Opening Mobile Download');
        setFeedback('Opening Mobile App Package');
        speakFeedback('Opening Mobile App Dialog');
        if (onOpenDownload) onOpenDownload();
        return;
      }

      if (lower.includes('dark mode') || lower.includes('light mode') || lower.includes('toggle theme')) {
        setLastCommand('Toggling Theme Mode');
        setFeedback('Theme mode toggled');
        speakFeedback('Toggling theme');
        if (onToggleDarkMode) onToggleDarkMode();
        return;
      }

      if (lower.includes('start recording') || lower.includes('record note') || lower.includes('voice note')) {
        startVoiceNoteRecording();
        return;
      }

      // Unknown or unmapped phrase
      setFeedback(`Heard: "${phrase}" (Say "go to vision", "show map", "open drillholes")`);
    },
    [
      onNavigate,
      onStartTour,
      onToggleDarkMode,
      onOpenDownload,
      isRecordingVoiceNote,
      speakFeedback,
    ]
  );

  // Initialize SpeechRecognition on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    setIsSupported(true);
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const heard = event.results[current][0].transcript;
      if (heard && heard.trim()) {
        processCommand(heard.trim());
      }
    };

    recognition.onerror = (event: any) => {
      console.warn('Speech recognition event warning:', event.error);
      if (event.error === 'not-allowed') {
        setIsListening(false);
        setFeedback('Microphone permission required for voice navigation.');
      }
    };

    recognition.onend = () => {
      // Auto-restart if user still wants it active
      if (isListening) {
        try {
          recognition.start();
        } catch (e) {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      try {
        recognition.stop();
      } catch (e) {}
    };
  }, [processCommand, isListening]);

  const startListening = () => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
      setIsListening(true);
      setFeedback('Listening for hands-free mining commands...');
      speakFeedback('Voice navigation active');
    } catch (e) {
      console.warn('Speech recognition start error:', e);
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;
    try {
      setIsListening(false);
      recognitionRef.current.stop();
      setFeedback('Voice navigation paused');
    } catch (e) {}
  };

  const toggleListening = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const startVoiceNoteRecording = () => {
    setIsRecordingVoiceNote(true);
    setActiveNoteDuration(0);
    activeNoteTranscriptRef.current = '';
    setFeedback('Recording geological voice note... Say "Stop recording" when finished.');
    speakFeedback('Recording voice note');

    recordingTimerRef.current = setInterval(() => {
      setActiveNoteDuration((sec) => sec + 1);
    }, 1000);
  };

  const stopVoiceNoteRecording = async (): Promise<VoiceNoteRecord | null> => {
    if (recordingTimerRef.current) {
      clearInterval(recordingTimerRef.current);
    }
    setIsRecordingVoiceNote(false);

    const fullTranscript = (activeNoteTranscriptRef.current || transcript || 'Field geological voice log').trim();
    if (!fullTranscript) return null;

    try {
      const savedNote = await saveVoiceFieldNote({
        transcript: fullTranscript,
        tag: `Field Voice Log (${activeTab.toUpperCase()})`,
        location: 'Exploration Camp Station',
      });
      setFeedback(`Voice note saved to offline storage (${savedNote.id})`);
      speakFeedback('Voice note saved');
      return savedNote;
    } catch (err) {
      console.error('Failed to save voice note to IndexedDB:', err);
      return null;
    }
  };

  return {
    isSupported,
    isListening,
    transcript,
    feedback,
    isRecordingVoiceNote,
    activeNoteDuration,
    lastCommand,
    startListening,
    stopListening,
    toggleListening,
    startVoiceNoteRecording,
    stopVoiceNoteRecording,
  };
}
