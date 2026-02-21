
import React, { useEffect, useRef } from 'react';
import { ButlerState } from '../types';

interface VoiceVisualizerProps {
  state: ButlerState;
  audioLevel: number;
}

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ state, audioLevel }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Refined Blink & Gaze state tracking
  const eyeRef = useRef({
    blinkProgress: 0, // 0 = open, 1 = closed
    isBlinking: false,
    blinkStartTime: 0,
    nextBlinkTime: Date.now() + 2000,
    gazeX: 0,
    gazeY: 0,
    targetGazeX: 0,
    targetGazeY: 0,
    lastGazeUpdate: 0
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let phase = 0;

    const resize = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      canvas.width = parent.clientWidth * window.devicePixelRatio;
      canvas.height = parent.clientHeight * window.devicePixelRatio;
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    };

    window.addEventListener('resize', resize);
    resize();

    const drawLocalizedWave = (
      centerX: number,
      centerY: number,
      width: number,
      color: string,
      amplitude: number,
      frequency: number,
      p: number,
      thickness: number,
      invert: boolean = false
    ) => {
      ctx.beginPath();
      ctx.strokeStyle = color;
      ctx.lineWidth = thickness;
      ctx.lineCap = 'round';

      const startX = centerX - width / 2;
      const endX = centerX + width / 2;

      for (let x = startX; x <= endX; x += 1) {
        const normalizedDist = Math.abs(x - centerX) / (width / 2);
        const taper = Math.pow(Math.cos(normalizedDist * Math.PI / 2), 3);
        const waveOffset = Math.sin((x - startX) * frequency + p) * 2;
        const y = centerY + (invert ? -amplitude : amplitude) * taper + waveOffset;
        
        if (x === startX) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    };

    const animate = () => {
      const { width, height } = canvas.getBoundingClientRect();
      const now = Date.now();
      ctx.clearRect(0, 0, width, height);

      const eyes = eyeRef.current;

      // --- 1. Gaze Micro-movements ---
      if (now - eyes.lastGazeUpdate > 2000 + Math.random() * 3000) {
        eyes.targetGazeX = (Math.random() - 0.5) * 8;
        eyes.targetGazeY = (Math.random() - 0.5) * 4;
        eyes.lastGazeUpdate = now;
      }
      eyes.gazeX += (eyes.targetGazeX - eyes.gazeX) * 0.05;
      eyes.gazeY += (eyes.targetGazeY - eyes.gazeY) * 0.05;

      // --- 2. Natural Blink Logic ---
      const blinkDuration = 180;
      if (!eyes.isBlinking && now > eyes.nextBlinkTime) {
        eyes.isBlinking = true;
        eyes.blinkStartTime = now;
      }

      if (eyes.isBlinking) {
        const elapsed = now - eyes.blinkStartTime;
        if (elapsed < blinkDuration) {
          eyes.blinkProgress = Math.sin((elapsed / blinkDuration) * Math.PI);
        } else {
          eyes.isBlinking = false;
          eyes.blinkProgress = 0;
          const isDoubleBlink = Math.random() < 0.15;
          eyes.nextBlinkTime = now + (isDoubleBlink ? 150 : (3000 + Math.random() * 6000));
        }
      }

      // --- 3. Colors & Speed ---
      let baseColor = '#22d3ee';
      if (state === ButlerState.SPEAKING) baseColor = '#fbbf24';
      if (state === ButlerState.THINKING) baseColor = '#a855f7';

      const centerX = width / 2;
      const centerY = height / 2;

      let speed = 0.04;
      if (state === ButlerState.SPEAKING) speed = 0.05 + audioLevel * 0.1;
      if (state === ButlerState.LISTENING) speed = 0.02;
      if (state === ButlerState.THINKING) speed = 0.15;
      phase += speed;

      // --- 4. Draw Eyes ---
      const faceCenterY = centerY; // true center of canvas
      const eyeOffsetY = -70 + eyes.gazeY;
      const eyeOffsetX = 90;
      const eyeWidth = 95;
      
      let baseEyeAmp = (2 + Math.sin(phase * 0.5) * 2);
      if (state === ButlerState.THINKING) baseEyeAmp += 3;
      const eyeAmp = baseEyeAmp * (1 - eyes.blinkProgress);

      [centerX - eyeOffsetX + eyes.gazeX, centerX + eyeOffsetX + eyes.gazeX].forEach((ex) => {
        for (let i = 0; i < 4; i++) {
          const p = phase + i * 0.8;
          const opacity = (1 - i / 4) * (0.6 - (eyes.blinkProgress * 0.4));
          const color = `${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
          drawLocalizedWave(ex, faceCenterY + eyeOffsetY, eyeWidth - i * 5, color, eyeAmp * (1 - i * 0.2), 0.06, p, 1.5 - i * 0.2, false);
        }
      });

      // --- 5. Draw Mouth (Softened Talking Animation) ---
      const mouthOffsetY = 70;
      const mouthWidth = (state === ButlerState.SPEAKING) ? 180 : 130;
      
      let mouthOpening = 3; // Minimal base state
      
      if (state === ButlerState.SPEAKING) {
        // Soft Talking Rhythm: A base rhythmic movement that doesn't depend on loudness
        const talkingCadence = (Math.sin(phase * 1.5) * 0.5 + 0.5) * 6;
        // Dampened Audio Reactivity: Lower multiplier to prevent "weird" fluctuation
        const audioInfluence = Math.min(audioLevel * 18, 12);
        mouthOpening = 4 + talkingCadence + audioInfluence;
      } else if (state === ButlerState.LISTENING) {
        // Very subtle jitter for listening
        mouthOpening = 3 + Math.min(audioLevel * 6, 4);
      } else if (state === ButlerState.THINKING) {
        // Static thinking vibration
        mouthOpening = 3 + Math.sin(phase * 5) * 1.5;
      }

      for (let i = 0; i < 5; i++) {
        const p = phase * 1.4 + i * 0.5;
        const opacity = (1 - i / 5) * 0.7;
        const color = `${baseColor}${Math.floor(opacity * 255).toString(16).padStart(2, '0')}`;
        const currentAmp = mouthOpening * (1 - i * 0.18);
        const currentWidth = mouthWidth - i * 12;
        
        // Upper line
        drawLocalizedWave(centerX, faceCenterY + mouthOffsetY, currentWidth, color, currentAmp, 0.025, p, 2.0 - i * 0.3, true);
        // Lower line
        drawLocalizedWave(centerX, faceCenterY + mouthOffsetY, currentWidth, color, currentAmp, 0.025, p + Math.PI, 2.0 - i * 0.3, false);
      }

      // Subtle atmospheric glow behind the face
      const pulse = (Math.sin(phase * 1.2) + 1) / 2;
      const glowGrad = ctx.createRadialGradient(centerX, faceCenterY, 0, centerX, faceCenterY, 350);
      glowGrad.addColorStop(0, `${baseColor}${Math.floor(pulse * 12).toString(16).padStart(2, '0')}`);
      glowGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = glowGrad;
      ctx.fillRect(0, 0, width, height);

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, [state, audioLevel]);

  return (
    <div className="w-full h-full flex items-center justify-center relative bg-transparent">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
      />
    </div>
  );
};

export default VoiceVisualizer;
