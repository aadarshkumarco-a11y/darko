"use client";

import { useEffect, useRef, useState, useCallback } from "react";

interface MusicControllerProps {
  musicOn: boolean;
  onToggle: () => void;
  /** Play a short sound effect (used by other components via the global function) */
}

/**
 * A Web Audio API based ambient music generator.
 * Creates a slow, cinematic Indian-flavored drone with tabla-like percussion.
 * No external audio files needed — fully synthesized.
 */
export function MusicController({ musicOn, onToggle }: MusicControllerProps) {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const intervalRef = useRef<number | null>(null);
  const [initialized, setInitialized] = useState(false);

  // Initialize audio context on first user interaction
  const ensureAudio = useCallback(() => {
    if (audioCtxRef.current) return audioCtxRef.current;
    try {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioContextClass();
      const master = ctx.createGain();
      master.gain.value = 0;
      master.connect(ctx.destination);
      audioCtxRef.current = ctx;
      masterGainRef.current = master;
      setInitialized(true);
      return ctx;
    } catch {
      return null;
    }
  }, []);

  // Drone notes (Indian classical inspired — sa, pa, sa)
  // Root: D3 ~ 146.83 Hz
  const playDrone = useCallback(() => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const frequencies = [146.83, 220, 293.66]; // D3, A3, D4 — sa, pa, sa
    frequencies.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      filter.type = "lowpass";
      filter.frequency.value = 800;

      osc.type = i === 0 ? "sine" : "triangle";
      osc.frequency.value = freq;

      // Slight detune for richness
      osc.detune.value = (Math.random() - 0.5) * 8;

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.08 / (i + 1), ctx.currentTime + 2);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      osc.start();

      // Slow LFO on gain for breathing effect
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.frequency.value = 0.1 + i * 0.05;
      lfoGain.gain.value = 0.03;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start();
    });
  }, []);

  // Tabla-like percussion every ~2.5s
  const playTabla = useCallback(() => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const now = ctx.currentTime;

    // "Dha" - low resonant hit
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(180, now);
    osc.frequency.exponentialRampToValueAtTime(60, now + 0.15);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + 0.3);

    // Higher "tin" hit offset
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "triangle";
    osc2.frequency.setValueAtTime(450, now + 0.05);
    osc2.frequency.exponentialRampToValueAtTime(200, now + 0.15);

    gain2.gain.setValueAtTime(0, now + 0.05);
    gain2.gain.linearRampToValueAtTime(0.05, now + 0.055);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

    osc2.connect(gain2);
    gain2.connect(master);
    osc2.start(now + 0.05);
    osc2.stop(now + 0.25);
  }, []);

  // Soft flute melody note
  const playFluteNote = useCallback((freq: number, duration: number) => {
    const ctx = audioCtxRef.current;
    const master = masterGainRef.current;
    if (!ctx || !master) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.value = 2000;
    filter.Q.value = 2;

    osc.type = "sine";
    osc.frequency.value = freq;

    // Slight vibrato
    const vibrato = ctx.createOscillator();
    const vibratoGain = ctx.createGain();
    vibrato.frequency.value = 5;
    vibratoGain.gain.value = 3;
    vibrato.connect(vibratoGain);
    vibratoGain.connect(osc.frequency);
    vibrato.start(now);
    vibrato.stop(now + duration);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.06, now + 0.1);
    gain.gain.setValueAtTime(0.06, now + duration - 0.3);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    osc.start(now);
    osc.stop(now + duration);
  }, []);

  // Pentatonic scale (raga-like): D, E, F#, A, B, D
  const FLUTE_NOTES = [293.66, 329.63, 369.99, 440, 493.88, 587.33];

  // Start/stop the music
  useEffect(() => {
    if (musicOn) {
      const ctx = ensureAudio();
      if (!ctx) return;
      if (ctx.state === "suspended") ctx.resume();

      // Fade in master
      const master = masterGainRef.current!;
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 1.5);

      // Start drone if not already playing
      if (!initialized) {
        playDrone();
      }

      // Schedule tabla + flute
      let beat = 0;
      intervalRef.current = window.setInterval(() => {
        playTabla();
        // Occasionally play a flute note
        if (beat % 3 === 0) {
          const note = FLUTE_NOTES[Math.floor(Math.random() * FLUTE_NOTES.length)];
          playFluteNote(note, 1.5 + Math.random());
        }
        beat++;
      }, 2500);
    } else if (initialized) {
      // Fade out
      const ctx = audioCtxRef.current;
      const master = masterGainRef.current;
      if (ctx && master) {
        master.gain.cancelScheduledValues(ctx.currentTime);
        master.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.5);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [musicOn, ensureAudio, playDrone, playTabla, playFluteNote, initialized]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Expose sound effects globally for buttons/quiz etc.
  useEffect(() => {
    (window as any).playSoundEffect = (type: "click" | "success" | "error" | "celebrate") => {
      const ctx = audioCtxRef.current;
      const master = masterGainRef.current;
      if (!ctx || !master || !musicOn) return;

      const now = ctx.currentTime;
      if (type === "click") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(800, now);
        osc.frequency.exponentialRampToValueAtTime(400, now + 0.08);
        gain.gain.setValueAtTime(0.06, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.12);
      } else if (type === "success") {
        [523.25, 659.25, 783.99].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0, now + i * 0.08);
          gain.gain.linearRampToValueAtTime(0.08, now + i * 0.08 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.3);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + i * 0.08);
          osc.stop(now + i * 0.08 + 0.35);
        });
      } else if (type === "error") {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.setValueAtTime(220, now);
        osc.frequency.exponentialRampToValueAtTime(150, now + 0.2);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.connect(gain);
        gain.connect(master);
        osc.start(now);
        osc.stop(now + 0.3);
      } else if (type === "celebrate") {
        [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.frequency.value = f;
          gain.gain.setValueAtTime(0, now + i * 0.05);
          gain.gain.linearRampToValueAtTime(0.1, now + i * 0.05 + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.05 + 0.8);
          osc.connect(gain);
          gain.connect(master);
          osc.start(now + i * 0.05);
          osc.stop(now + i * 0.05 + 0.85);
        });
      }
    };
  }, [musicOn]);

  return null;
}
