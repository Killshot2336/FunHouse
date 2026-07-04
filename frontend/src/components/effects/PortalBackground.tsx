import { useEffect, useRef } from 'react';

export function PortalBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    let time = 0;
    const particles: Array<{ x: number; y: number; vx: number; vy: number; size: number; alpha: number; hue: number }> = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 120; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.8,
        vy: (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2.5 + 0.5,
        alpha: Math.random() * 0.8 + 0.2,
        hue: 100 + Math.random() * 40,
      });
    }

    const draw = () => {
      time += 0.016;
      ctx.fillStyle = 'rgba(10, 10, 10, 0.15)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height * 0.35;
      const portalR = 80 + Math.sin(time * 2) * 10;

      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, portalR * 3);
      grad.addColorStop(0, 'rgba(57, 255, 20, 0.25)');
      grad.addColorStop(0.3, 'rgba(0, 255, 65, 0.08)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.beginPath();
      ctx.arc(cx, cy, portalR, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(57, 255, 20, ${0.4 + Math.sin(time * 3) * 0.2})`;
      ctx.lineWidth = 2;
      ctx.stroke();

      for (let ring = 1; ring <= 3; ring++) {
        ctx.beginPath();
        ctx.arc(cx, cy, portalR + ring * 25 + Math.sin(time + ring) * 5, time * ring * 0.5, time * ring * 0.5 + Math.PI * 1.2);
        ctx.strokeStyle = `rgba(57, 255, 20, ${0.15 / ring})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      particles.forEach((p, i) => {
        const dx = cx - p.x;
        const dy = cy - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 200) {
          p.vx += dx * 0.00008;
          p.vy += dy * 0.00008;
        }
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${p.hue}, 100%, 60%, ${p.alpha})`;
        ctx.fill();

        const next = particles[(i + 1) % particles.length];
        if (dist < 150 && Math.hypot(p.x - next.x, p.y - next.y) < 80) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(next.x, next.y);
          ctx.strokeStyle = `rgba(57, 255, 20, 0.08)`;
          ctx.stroke();
        }
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <>
      <div className="portal-swirl fixed inset-0 pointer-events-none z-0" />
      <div className="portal-ring fixed top-[20%] left-1/2 -translate-x-1/2 w-64 h-64 pointer-events-none z-0" />
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
    </>
  );
}
