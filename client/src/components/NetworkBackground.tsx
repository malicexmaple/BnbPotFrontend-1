import { useEffect, useRef } from "react";

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  baseVx: number;
  baseVy: number;
}

interface NetworkBackgroundProps {
  className?: string;
  color?: "gold" | "gray" | "purple" | "orange" | "pink";
  sizeMultiplier?: number;
}

export function NetworkBackground({ className = "", color = "gold", sizeMultiplier = 1.0 }: NetworkBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particlesRef = useRef<Particle[]>([]);
  const animationFrameRef = useRef<number>();
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    const rect = canvas.getBoundingClientRect();
    const area = rect.width * rect.height;
    const particleCount = Math.max(Math.floor(area / 25000), 5);
    
    particlesRef.current = Array.from({ length: particleCount }, (_, i) => {
      const gridSize = Math.ceil(Math.sqrt(particleCount));
      const gridX = (i % gridSize) / gridSize;
      const gridY = Math.floor(i / gridSize) / gridSize;
      
      const x = (gridX + Math.random()) * rect.width;
      const y = (gridY + Math.random()) * rect.height;
      
      const vx = (Math.random() - 0.5) * 0.1;
      const vy = (Math.random() - 0.5) * 0.1;
      return {
        x: x % rect.width,
        y: y % rect.height,
        vx,
        vy,
        baseVx: vx,
        baseVy: vy,
        radius: (Math.random() * 1.04 + 1.56) * sizeMultiplier,
      };
    });

    const animate = () => {
      if (!canvas || !ctx) return;

      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);

      const particles = particlesRef.current;

      particles.forEach((particle, i) => {
        const mouse = mouseRef.current;
        const dx = particle.x - mouse.x;
        const dy = particle.y - mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDistance = 200;

        if (distance < minDistance) {
          const force = (minDistance - distance) / minDistance;
          particle.vx = particle.baseVx + (dx / distance) * force * 5;
          particle.vy = particle.baseVy + (dy / distance) * force * 5;
        } else {
          particle.vx += (particle.baseVx - particle.vx) * 0.05;
          particle.vy += (particle.baseVy - particle.vy) * 0.05;
        }

        particle.x += particle.vx;
        particle.y += particle.vy;

        if (particle.x < 0) particle.x = rect.width;
        if (particle.x > rect.width) particle.x = 0;
        if (particle.y < 0) particle.y = rect.height;
        if (particle.y > rect.height) particle.y = 0;

        const particleSize = particle.radius;
        const colorMap: Record<string, string> = {
          gray: "rgba(140, 140, 140, 0.9)",
          purple: "rgba(140, 110, 235, 1)",
          gold: "rgba(255, 215, 0, 1)",
          orange: "rgba(255, 165, 0, 1)",
          pink: "rgba(255, 71, 143, 0.95)"
        };
        ctx.fillStyle = colorMap[color] || colorMap.gold;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particleSize, 0, Math.PI * 2);
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const other = particles[j];
          const dx = particle.x - other.x;
          const dy = particle.y - other.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          const connectionRange = 120;
          if (distance < connectionRange) {
            const baseOpacity = color === "gray" ? 0.15 : 0.3;
            const opacity = (1 - distance / connectionRange) * baseOpacity;
            const lineColorMap: Record<string, string> = {
              gray: `rgba(120, 120, 120, ${opacity})`,
              purple: `rgba(140, 110, 235, ${opacity})`,
              gold: `rgba(255, 215, 0, ${opacity})`,
              orange: `rgba(255, 165, 0, ${opacity})`,
              pink: `rgba(255, 71, 143, ${opacity})`
            };
            ctx.strokeStyle = lineColorMap[color] || lineColorMap.gold;
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(other.x, other.y);
            ctx.stroke();
          }
        }
      });

      const mouse = mouseRef.current;
      if (mouse.x > 0 && mouse.y > 0 && mouse.x < canvas.width && mouse.y < canvas.height) {
        const maxInteractionDistance = 300;
        let hasConnection = false;
        
        particles.forEach((particle) => {
          const dx = particle.x - mouse.x;
          const dy = particle.y - mouse.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          
          if (distance < maxInteractionDistance) {
            hasConnection = true;
            const opacity = (1 - distance / maxInteractionDistance) * 0.5;
            const mouseLineColorMap: Record<string, string> = {
              gray: `rgba(140, 140, 140, ${opacity})`,
              purple: `rgba(140, 110, 235, ${opacity})`,
              gold: `rgba(255, 215, 0, ${opacity})`,
              orange: `rgba(255, 165, 0, ${opacity})`,
              pink: `rgba(255, 71, 143, ${opacity})`
            };
            ctx.strokeStyle = mouseLineColorMap[color] || mouseLineColorMap.gold;
            
            ctx.lineWidth = 1.5;
            ctx.beginPath();
            ctx.moveTo(particle.x, particle.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        });

        if (hasConnection) {
          const mouseDotColorMap: Record<string, string> = {
            gray: "rgba(140, 140, 140, 0.7)",
            purple: "rgba(140, 110, 235, 0.7)",
            gold: "rgba(255, 215, 0, 0.7)",
            orange: "rgba(255, 165, 0, 0.7)",
            pink: "rgba(255, 71, 143, 0.7)"
          };
          ctx.fillStyle = mouseDotColorMap[color] || mouseDotColorMap.gold;
          
          ctx.beginPath();
          ctx.arc(mouse.x, mouse.y, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
        mouseRef.current = { x, y };
      } else {
        mouseRef.current = { x: -1000, y: -1000 };
      }
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseleave", () => {
      mouseRef.current = { x: -1000, y: -1000 };
    });

    animate();

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      document.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [color, sizeMultiplier]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
