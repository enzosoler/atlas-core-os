import React, { useState, useEffect } from 'react';
import { Volume2, SkipForward } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function RestTimer({ duration = 90, onComplete }) {
  const [remaining, setRemaining] = useState(duration);
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (!isActive || remaining <= 0) {
      if (remaining <= 0) {
        // Play sound notification
        try {
          const audioContext = new (window.AudioContext || window.webkitAudioContext)();
          const oscillator = audioContext.createOscillator();
          const gainNode = audioContext.createGain();
          oscillator.connect(gainNode);
          gainNode.connect(audioContext.destination);
          oscillator.frequency.value = 800;
          oscillator.type = 'sine';
          gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
          oscillator.start(audioContext.currentTime);
          oscillator.stop(audioContext.currentTime + 0.5);
        } catch (e) {
          console.log('Audio notification skipped');
        }
        
        // Vibrate if available
        if (navigator.vibrate) {
          navigator.vibrate([100, 50, 100]);
        }
        
        onComplete?.();
      }
      return;
    }

    const timer = setInterval(() => {
      setRemaining(r => {
        if (r <= 1) {
          setIsActive(false);
          return 0;
        }
        return r - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, remaining, onComplete]);

  const minutes = Math.floor(remaining / 60);
  const seconds = remaining % 60;
  const progress = ((duration - remaining) / duration) * 100;

  return (
    <div className="surface p-6 text-center space-y-6">
      <p className="t-small text-muted-foreground">Descanse</p>
      
      {/* Timer Display */}
      <div className="relative w-48 h-48 mx-auto">
        <svg className="w-full h-full -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="hsl(var(--shell))"
            strokeWidth="8"
          />
          <circle
            cx="96"
            cy="96"
            r="88"
            fill="none"
            stroke="hsl(var(--brand))"
            strokeWidth="8"
            strokeDasharray={`${(progress / 100) * 553} 553`}
            strokeLinecap="round"
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <div>
            <p className="text-[48px] font-bold tabular-nums">
              {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
            </p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <Button
          onClick={() => setIsActive(!isActive)}
          variant="outline"
          className="flex-1 h-10 rounded-lg"
        >
          {isActive ? 'Pausar' : 'Retomar'}
        </Button>
        <Button
          onClick={() => onComplete?.()}
          className="flex-1 h-10 rounded-lg bg-[hsl(var(--brand))] hover:bg-[hsl(var(--brand)/0.85)] text-white gap-2"
        >
          <SkipForward className="w-4 h-4" />
          Próximo
        </Button>
      </div>
    </div>
  );
}