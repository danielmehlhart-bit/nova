'use client';
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
type RecognitionEvent = {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: { isFinal: boolean; 0: { transcript: string } };
  };
};
type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((e: RecognitionEvent) => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type SpeechWindow = Window & {
  SpeechRecognition?: new () => Recognition;
  webkitSpeechRecognition?: new () => Recognition;
};
export function useVoice(
  onTranscript: (text: string) => void,
  serverVoice = false,
) {
  const supported = useSyncExternalStore(
    () => () => {},
    () => {
      const w = window as SpeechWindow;
      return serverVoice
        ? !!navigator.mediaDevices &&
            typeof window.MediaRecorder !== 'undefined'
        : !!(w.SpeechRecognition || w.webkitSpeechRecognition);
    },
    () => null,
  );
  const [listening, setListening] = useState(false),
    [transcribing, setTranscribing] = useState(false),
    [interim, setInterim] = useState(''),
    [error, setError] = useState(''),
    [spoken, setSpoken] = useState(true),
    [speaking, setSpeaking] = useState(false);
  const recognition = useRef<Recognition | null>(null),
    recorder = useRef<MediaRecorder | null>(null),
    stream = useRef<MediaStream | null>(null),
    recordTimer = useRef<ReturnType<typeof setTimeout> | null>(null),
    pendingMic = useRef(false),
    mounted = useRef(true),
    upload = useRef<AbortController | null>(null),
    callback = useRef(onTranscript);
  useEffect(() => {
    callback.current = onTranscript;
  }, [onTranscript]);
  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      recognition.current?.abort();
      if (recorder.current?.state === 'recording') recorder.current.stop();
      stream.current?.getTracks().forEach((t) => t.stop());
      if (recordTimer.current) clearTimeout(recordTimer.current);
      upload.current?.abort();
      window.speechSynthesis?.cancel();
    };
  }, []);
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        setSpoken(localStorage.getItem('nova-spoken') !== 'false');
      } catch {
        /* Keep default. */
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);
  const quiet = useCallback(() => {
    window.speechSynthesis?.cancel();
    setSpeaking(false);
  }, []);
  const stop = useCallback(() => {
    if (recorder.current?.state === 'recording') recorder.current.stop();
    recognition.current?.stop();
  }, []);
  const listen = useCallback(async () => {
    if (transcribing || pendingMic.current) return;
    if (recorder.current?.state === 'recording' || recognition.current) {
      stop();
      return;
    }
    setError('');
    setInterim('');
    quiet();
    if (
      serverVoice &&
      navigator.mediaDevices?.getUserMedia &&
      window.MediaRecorder
    ) {
      pendingMic.current = true;
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true },
          video: false,
        });
        if (!mounted.current) {
          media.getTracks().forEach((t) => t.stop());
          return;
        }
        stream.current = media;
        const type = ['audio/webm;codecs=opus', 'audio/mp4', 'audio/webm'].find(
          (t) => MediaRecorder.isTypeSupported(t),
        );
        const rec = new MediaRecorder(
          media,
          type ? { mimeType: type } : undefined,
        );
        recorder.current = rec;
        const chunks: Blob[] = [];
        rec.ondataavailable = (e) => {
          if (e.data.size) chunks.push(e.data);
        };
        rec.onerror = () => {
          setError(
            'The microphone stopped unexpectedly. Please try again or type.',
          );
          media.getTracks().forEach((t) => t.stop());
          setListening(false);
        };
        rec.onstop = async () => {
          if (recordTimer.current) clearTimeout(recordTimer.current);
          media.getTracks().forEach((t) => t.stop());
          stream.current = null;
          recorder.current = null;
          if (!mounted.current) return;
          setListening(false);
          setTranscribing(true);
          const abort = new AbortController();
          upload.current = abort;
          const timeout = setTimeout(() => abort.abort(), 30000);
          try {
            const form = new FormData();
            const mime = rec.mimeType || chunks[0]?.type || 'audio/webm';
            form.set(
              'audio',
              new Blob(chunks, { type: mime }),
              mime.includes('mp4') ? 'voice.m4a' : 'voice.webm',
            );
            const res = await fetch('/api/transcribe', {
              method: 'POST',
              body: form,
              signal: abort.signal,
            });
            const result = (await res.json()) as {
              text?: string;
              error?: string;
            };
            if (!res.ok || typeof result.text !== 'string')
              throw new Error(
                typeof result.error === 'string'
                  ? result.error
                  : 'I could not transcribe that recording.',
              );
            if (mounted.current) callback.current(result.text);
          } catch (e) {
            if (mounted.current)
              setError(
                e instanceof Error && e.name === 'AbortError'
                  ? 'Voice transcription timed out. Please try again or type.'
                  : e instanceof Error
                    ? e.message
                    : 'Voice transcription failed.',
              );
          } finally {
            clearTimeout(timeout);
            upload.current = null;
            if (mounted.current) setTranscribing(false);
          }
        };
        rec.start();
        setListening(true);
        recordTimer.current = setTimeout(() => {
          if (rec.state === 'recording') rec.stop();
        }, 25000);
      } catch (e) {
        if (mounted.current)
          setError(
            e instanceof DOMException && e.name === 'NotAllowedError'
              ? 'Microphone access was not granted. Allow it in browser settings, or use text.'
              : 'No microphone could be opened. Check the device and browser permissions, or type.',
          );
      } finally {
        pendingMic.current = false;
      }
      return;
    }
    const w = window as SpeechWindow,
      Ctor = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!Ctor) {
      setError(
        'Voice input is unavailable here. Use keyboard dictation or type your request.',
      );
      return;
    }
    const r = new Ctor();
    r.lang = 'en-US';
    r.continuous = false;
    r.interimResults = true;
    recognition.current = r;
    let final = '';
    r.onresult = (e) => {
      let draft = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript + ' ';
        else draft += e.results[i][0].transcript;
      }
      setInterim((final + draft).trim());
      if (final.trim()) r.stop();
    };
    r.onerror = (e) => {
      const errors: Record<string, string> = {
        'not-allowed':
          'Allow microphone access in browser settings, or type your request.',
        'audio-capture': 'No microphone is available. You can still type.',
        network:
          'The browser speech service could not connect. Please type or try again.',
        'no-speech':
          'I did not hear anything. Tap the microphone and try again.',
        'service-not-allowed':
          'Speech recognition is unavailable here. Please type or use keyboard dictation.',
      };
      if (e.error !== 'aborted')
        setError(
          errors[e.error] || 'Voice input stopped. Please try again or type.',
        );
    };
    r.onend = () => {
      recognition.current = null;
      if (!mounted.current) return;
      setListening(false);
      setInterim('');
      if (final.trim()) callback.current(final.trim());
    };
    try {
      r.start();
      setListening(true);
    } catch {
      recognition.current = null;
      setListening(false);
      setError('The microphone could not start. Please try again or type.');
    }
  }, [serverVoice, transcribing, stop, quiet]);
  const say = useCallback(
    (text: string, speaker: number | 'aura' = 'aura') => {
      if (
        !spoken ||
        !window.speechSynthesis ||
        recognition.current ||
        recorder.current
      )
        return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'en-US';
      const voices = window.speechSynthesis
        .getVoices()
        .filter((v) => v.lang.startsWith('en'));
      if (voices.length)
        u.voice =
          voices[(speaker === 'aura' ? 0 : speaker + 1) % voices.length];
      u.rate = speaker === 'aura' ? 0.96 : 0.91 + (speaker % 3) * 0.04;
      u.pitch = speaker === 'aura' ? 1 : 0.9 + (speaker % 4) * 0.07;
      u.onstart = () => setSpeaking(true);
      u.onend = u.onerror = () => setSpeaking(false);
      window.speechSynthesis.speak(u);
    },
    [spoken],
  );
  const toggleSpoken = useCallback(() => {
    quiet();
    const next = !spoken;
    setSpoken(next);
    try {
      localStorage.setItem('nova-spoken', String(next));
    } catch {
      /* Voice still works without storage. */
    }
  }, [quiet, spoken]);
  const clearError = useCallback(() => setError(''), []);
  return {
    clearError,
    supported,
    listening,
    transcribing,
    interim,
    error,
    spoken,
    speaking,
    listen,
    stop,
    say,
    quiet,
    toggleSpoken,
  };
}
