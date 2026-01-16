/**
 * Music Room Component
 *
 * A dedicated playground where kids can play their owned instruments
 * Uses Web Audio API to generate sounds - no audio files needed
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { X, Music, Volume2, VolumeX } from 'lucide-react';
import { ShopItem, getShopItem } from '../engine/shopTypes';

interface MusicRoomProps {
  ownedInstruments: string[];
  onClose: () => void;
}

// Color schemes for different instruments
const INSTRUMENT_COLORS: Record<string, string[]> = {
  piano: ['#1a1a2e', '#16213e', '#0f3460', '#e94560', '#e94560', '#0f3460', '#16213e', '#1a1a2e'],
  xylophone: ['#FF6B6B', '#FF8E72', '#FFC145', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD'],
  drums: ['#8B4513', '#A0522D', '#CD853F', '#D2691E'],
  guitar: ['#8B4513', '#CD853F', '#DEB887', '#D2B48C', '#BC8F8F', '#A52A2A'],
  trumpet: ['#FFD700', '#FFA500', '#FF8C00', '#FF6347', '#DC143C'],
  triangle: ['#C0C0C0', '#A9A9A9', '#808080'],
};

// Instrument-specific waveforms
const INSTRUMENT_WAVEFORMS: Record<string, OscillatorType> = {
  piano: 'sine',
  xylophone: 'sine',
  drums: 'triangle',
  guitar: 'sawtooth',
  trumpet: 'square',
  triangle: 'sine',
};

export const MusicRoom: React.FC<MusicRoomProps> = ({
  ownedInstruments,
  onClose,
}) => {
  const [activeInstrument, setActiveInstrument] = useState<string | null>(
    ownedInstruments[0] || null
  );
  const [muted, setMuted] = useState(false);
  const [playingNotes, setPlayingNotes] = useState<Set<number>>(new Set());
  const audioContextRef = useRef<AudioContext | null>(null);

  // Initialize audio context on first interaction
  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  // Play a note
  const playNote = useCallback((frequency: number, index: number) => {
    if (muted || !activeInstrument) return;

    const ctx = getAudioContext();
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const item = getShopItem(activeInstrument);
    if (!item) return;

    const waveform = INSTRUMENT_WAVEFORMS[activeInstrument] || 'sine';

    // Create oscillator
    const oscillator = ctx.createOscillator();
    oscillator.type = waveform;
    oscillator.frequency.value = frequency;

    // Create gain node for envelope
    const gainNode = ctx.createGain();
    gainNode.gain.value = 0;

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    // Start oscillator
    oscillator.start();

    // Add visual feedback
    setPlayingNotes(prev => new Set(prev).add(index));

    // ADSR envelope (simplified)
    const now = ctx.currentTime;
    const attackTime = 0.02;
    const decayTime = 0.1;
    const sustainLevel = 0.3;
    const releaseTime = activeInstrument === 'drums' ? 0.1 : 0.3;

    // Attack
    gainNode.gain.linearRampToValueAtTime(0.8, now + attackTime);
    // Decay
    gainNode.gain.linearRampToValueAtTime(sustainLevel, now + attackTime + decayTime);
    // Release
    gainNode.gain.linearRampToValueAtTime(0, now + attackTime + decayTime + releaseTime);

    // Stop oscillator after release
    setTimeout(() => {
      oscillator.stop();
      oscillator.disconnect();
      gainNode.disconnect();
      setPlayingNotes(prev => {
        const next = new Set(prev);
        next.delete(index);
        return next;
      });
    }, (attackTime + decayTime + releaseTime) * 1000 + 50);
  }, [muted, activeInstrument, getAudioContext]);

  // Cleanup audio context on unmount
  useEffect(() => {
    return () => {
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const ownedItems = ownedInstruments
    .map(id => getShopItem(id))
    .filter((item): item is ShopItem => item !== undefined);

  const currentItem = activeInstrument ? getShopItem(activeInstrument) : null;
  const frequencies = currentItem?.frequencies || [];
  const colors = INSTRUMENT_COLORS[activeInstrument || ''] || [];

  if (ownedItems.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 max-w-md w-full text-center">
          <Music className="w-16 h-16 mx-auto mb-4 text-purple-400 opacity-50" />
          <h2 className="text-xl font-bold text-white mb-2">No Instruments Yet!</h2>
          <p className="text-white/60 mb-6">Visit the shop to buy some instruments!</p>
          <button
            onClick={onClose}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500
              text-white font-bold rounded-xl hover:scale-105 active:scale-95 transition-transform"
          >
            Go to Shop
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-slate-900 z-50 flex flex-col">
      {/* Header */}
      <div className="flex justify-between items-center p-4">
        <div className="flex items-center gap-3">
          <Music className="w-8 h-8 text-pink-400" />
          <h2 className="text-2xl font-bold text-white">Music Room</h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setMuted(!muted)}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? (
              <VolumeX className="w-6 h-6 text-white/50" />
            ) : (
              <Volume2 className="w-6 h-6 text-white" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors"
            aria-label="Close"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
      </div>

      {/* Instrument selector */}
      <div className="flex gap-3 px-4 pb-4 overflow-x-auto">
        {ownedItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveInstrument(item.id)}
            className={`
              flex flex-col items-center px-4 py-3 rounded-xl transition-all
              ${activeInstrument === item.id
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 scale-105'
                : 'bg-white/10 hover:bg-white/20'
              }
            `}
          >
            <span className="text-3xl mb-1">{item.icon}</span>
            <span className="text-white text-xs font-medium">{item.name}</span>
          </button>
        ))}
      </div>

      {/* Instrument play area */}
      <div className="flex-1 flex items-center justify-center p-4">
        {currentItem && (
          <div className="w-full max-w-2xl">
            {/* Instrument name */}
            <div className="text-center mb-6">
              <span className="text-6xl">{currentItem.icon}</span>
              <h3 className="text-2xl font-bold text-white mt-2">{currentItem.name}</h3>
              <p className="text-white/60">Tap the keys to play!</p>
            </div>

            {/* Keys/Buttons */}
            <div className={`
              flex gap-2 justify-center flex-wrap
              ${activeInstrument === 'drums' ? 'max-w-xs mx-auto' : ''}
            `}>
              {frequencies.map((freq, i) => (
                <button
                  key={i}
                  onClick={() => playNote(freq, i)}
                  onTouchStart={(e) => {
                    e.preventDefault();
                    playNote(freq, i);
                  }}
                  className={`
                    ${activeInstrument === 'drums'
                      ? 'w-20 h-20 rounded-full'
                      : activeInstrument === 'triangle'
                        ? 'w-24 h-24 rounded-full'
                        : 'w-12 h-24 rounded-lg'
                    }
                    transition-all duration-100
                    ${playingNotes.has(i)
                      ? 'scale-95 brightness-150'
                      : 'hover:scale-105'
                    }
                    shadow-lg
                  `}
                  style={{
                    backgroundColor: colors[i % colors.length] || '#4CAF50',
                    boxShadow: playingNotes.has(i)
                      ? `0 0 30px ${colors[i % colors.length] || '#4CAF50'}`
                      : undefined,
                  }}
                />
              ))}
            </div>

            {/* Note names for piano */}
            {activeInstrument === 'piano' && (
              <div className="flex gap-2 justify-center mt-2">
                {['C', 'D', 'E', 'F', 'G', 'A', 'B', 'C'].map((note, i) => (
                  <span key={i} className="w-12 text-center text-white/60 text-sm">
                    {note}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Fun tip */}
      <div className="text-center p-4">
        <p className="text-white/40 text-sm">
          Try playing a song!
        </p>
      </div>
    </div>
  );
};
