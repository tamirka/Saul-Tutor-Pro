
import React, { useRef, useEffect } from 'react';

interface WaveformProps {
  analyser: AnalyserNode | null;
}

const Waveform: React.FC<WaveformProps> = ({ analyser }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  // Fix: Initialize useRef with null to satisfy TypeScript's requirement for an initial value.
  const animationFrameId = useRef<number | null>(null);

  useEffect(() => {
    if (!analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext('2d');
    
    // Fix: The component is named "Waveform" but was displaying a frequency chart.
    // Switched to getByteTimeDomainData and updated drawing logic for a proper waveform visualization.
    analyser.fftSize = 256;
    const bufferLength = analyser.fftSize;
    const dataArray = new Uint8Array(bufferLength);

    const draw = () => {
      if (!canvasCtx) return;

      animationFrameId.current = requestAnimationFrame(draw);
      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.clearRect(0, 0, canvas.width, canvas.height);
      
      const primaryColor = document.documentElement.classList.contains('dark') ? '#A5B4FC' : '#4F46E5';
      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = primaryColor;

      canvasCtx.beginPath();

      const sliceWidth = canvas.width * 1.0 / bufferLength;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // value is 0-255, 128 is center
        const y = v * canvas.height / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    };

    draw();

    return () => {
      if (animationFrameId.current) {
        cancelAnimationFrame(animationFrameId.current);
      }
    };
  }, [analyser]);

  return <canvas ref={canvasRef} width="100" height="40" className="transition-opacity duration-300" />;
};

export default Waveform;
