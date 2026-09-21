import React, { useRef, useEffect, useCallback } from 'react';

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  extraScale?: number;
}

export const ClickSpark: React.FC<ClickSparkProps> = ({
  sparkColor,
  sparkSize = 10,
  sparkRadius = 18,
  sparkCount = 8,
  duration = 420,
  extraScale = 1.0,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sparksRef = useRef<Spark[]>([]);
  const animFrameIdRef = useRef<number | null>(null);

  // Resize canvas to full screen with device pixel ratio
  const handleResize = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.scale(dpr, dpr);
    }
  }, []);

  useEffect(() => {
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [handleResize]);

  // Main animation loop
  const draw = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      ctx.clearRect(0, 0, canvas.width / dpr, canvas.height / dpr);

      // Resolve color from CSS variable if not passed
      let color = sparkColor;
      if (!color) {
        const rootStyle = getComputedStyle(document.documentElement);
        color = rootStyle.getPropertyValue('--theme-accent').trim() || '#A855F7';
      }

      // Filter and draw active sparks
      sparksRef.current = sparksRef.current.filter((spark) => {
        const elapsed = now - spark.startTime;
        if (elapsed >= duration) return false;

        const progress = elapsed / duration;
        // Ease out quadratic
        const ease = 1 - (1 - progress) * (1 - progress);

        const currentRadius = ease * sparkRadius * extraScale;
        const currentLength = sparkSize * (1 - progress);

        const x1 = spark.x + Math.cos(spark.angle) * currentRadius;
        const y1 = spark.y + Math.sin(spark.angle) * currentRadius;
        const x2 = spark.x + Math.cos(spark.angle) * (currentRadius + currentLength);
        const y2 = spark.y + Math.sin(spark.angle) * (currentRadius + currentLength);

        ctx.save();
        ctx.strokeStyle = color;
        ctx.globalAlpha = Math.max(0, 1 - progress);
        ctx.lineWidth = 1.5;
        ctx.lineCap = 'round';
        ctx.shadowColor = color;
        ctx.shadowBlur = 4;

        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();

        return true;
      });

      if (sparksRef.current.length > 0) {
        animFrameIdRef.current = requestAnimationFrame(draw);
      } else {
        animFrameIdRef.current = null;
      }
    },
    [duration, extraScale, sparkColor, sparkRadius, sparkSize]
  );

  // Trigger sparks on pointer down
  useEffect(() => {
    const onPointerDown = (e: PointerEvent) => {
      // Don't spark on right click
      if (e.button !== 0) return;

      const now = performance.now();
      const count = sparkCount;
      const step = (Math.PI * 2) / count;
      const angleOffset = Math.random() * Math.PI;

      for (let i = 0; i < count; i++) {
        sparksRef.current.push({
          x: e.clientX,
          y: e.clientY,
          angle: i * step + angleOffset + (Math.random() - 0.5) * 0.2,
          startTime: now,
        });
      }

      if (!animFrameIdRef.current) {
        animFrameIdRef.current = requestAnimationFrame(draw);
      }
    };

    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', onPointerDown);
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [draw, sparkCount]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[9999]"
      style={{ width: '100vw', height: '100vh' }}
      aria-hidden="true"
    />
  );
};

export default ClickSpark;
