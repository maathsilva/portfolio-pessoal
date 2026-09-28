// A quiet canvas "data network" — nodes drifting slowly, linking when close,
// with the occasional bright packet travelling an edge. Used for the hero
// background and the "entering the system" transition. Deliberately 2D
// canvas rather than WebGL: it is cheap enough to run continuously, needs no
// extra dependency, and degrades gracefully.

export interface DataNetworkHandle {
  /** 0..1 external driver (e.g. scroll progress) — raises particle speed,
   *  link distance and brightness. Safe to call every frame. */
  setIntensity(value: number): void;
  destroy(): void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  r: number;
  cyan: boolean;
}

interface Packet {
  from: number;
  to: number;
  t: number;
  speed: number;
}

export interface DataNetworkOptions {
  /** particles per square px divisor — lower = denser. */
  areaPerParticle?: number;
  maxParticles?: number;
  linkDistance?: number;
  interactive?: boolean;
  baseSpeed?: number;
}

export function mountDataNetwork(canvas: HTMLCanvasElement, opts: DataNetworkOptions = {}): DataNetworkHandle {
  const ctx = canvas.getContext('2d', { alpha: true });
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isSmall = window.innerWidth < 720;
  const finePointer = opts.interactive && window.matchMedia('(pointer: fine)').matches;

  const areaPerParticle = opts.areaPerParticle ?? 9000;
  const maxParticles = opts.maxParticles ?? (isSmall ? 46 : 90);
  const linkDistance = opts.linkDistance ?? (isSmall ? 110 : 150);
  const baseSpeed = opts.baseSpeed ?? 0.12;

  let dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  let width = 0;
  let height = 0;
  let particles: Particle[] = [];
  let packets: Packet[] = [];
  let intensity = 1;
  let rafId = 0;
  let running = false;
  let pointer: { x: number; y: number } | null = null;

  function seed() {
    const count = Math.min(maxParticles, Math.max(18, Math.floor((width * height) / areaPerParticle)));
    particles = Array.from({ length: count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * baseSpeed,
      vy: (Math.random() - 0.5) * baseSpeed,
      r: Math.random() < 0.15 ? 1.8 : 1.1,
      cyan: Math.random() < 0.12,
    }));
    packets = Array.from({ length: Math.min(5, Math.floor(count / 14)) }, () => spawnPacket());
  }

  function spawnPacket(): Packet {
    const from = Math.floor(Math.random() * particles.length);
    const to = Math.floor(Math.random() * particles.length);
    return { from, to, t: 0, speed: 0.006 + Math.random() * 0.006 };
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);
    seed();
  }

  function step() {
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);

    const speedMul = 0.6 + intensity * 1.1;
    const linkD = linkDistance * (0.85 + intensity * 0.35);

    for (const p of particles) {
      p.x += p.vx * speedMul;
      p.y += p.vy * speedMul;
      if (p.x < -20) p.x = width + 20;
      if (p.x > width + 20) p.x = -20;
      if (p.y < -20) p.y = height + 20;
      if (p.y > height + 20) p.y = -20;

      if (pointer) {
        const dx = p.x - pointer.x;
        const dy = p.y - pointer.y;
        const d2 = dx * dx + dy * dy;
        if (d2 < 130 * 130) {
          const d = Math.sqrt(d2) || 1;
          const force = (1 - d / 130) * 0.35;
          p.vx += (dx / d) * force * 0.02;
          p.vy += (dy / d) * force * 0.02;
        }
      }
    }

    const accentAlpha = 0.16 + intensity * 0.22;
    ctx.lineWidth = 1;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const a = particles[i];
        const b = particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < linkD) {
          const alpha = accentAlpha * (1 - dist / linkD);
          ctx.strokeStyle = `rgba(59, 130, 246, ${alpha.toFixed(3)})`;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        }
      }
    }

    for (const p of particles) {
      ctx.beginPath();
      ctx.fillStyle = p.cyan
        ? `rgba(34, 211, 238, ${0.5 + intensity * 0.3})`
        : `rgba(147, 197, 253, ${0.55 + intensity * 0.35})`;
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
    }

    if (particles.length > 4) {
      for (const packet of packets) {
        packet.t += packet.speed * (0.7 + intensity);
        if (packet.t >= 1) Object.assign(packet, spawnPacket());
        const from = particles[packet.from];
        const to = particles[packet.to];
        if (!from || !to) continue;
        const x = from.x + (to.x - from.x) * packet.t;
        const y = from.y + (to.y - from.y) * packet.t;
        ctx.beginPath();
        ctx.fillStyle = `rgba(34, 211, 238, ${0.55 + intensity * 0.35})`;
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (running) rafId = requestAnimationFrame(step);
  }

  function start() {
    if (running) return;
    running = true;
    rafId = requestAnimationFrame(step);
  }
  function stop() {
    running = false;
    if (rafId) cancelAnimationFrame(rafId);
  }

  let resizeTimer = 0;
  const onResize = () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 120);
  };
  const onVisibility = () => {
    if (document.hidden) stop();
    else if (io ? isIntersecting : true) start();
  };
  const onPointerMove = (e: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    pointer = { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };
  const onPointerLeave = () => {
    pointer = null;
  };

  let isIntersecting = true;
  let io: IntersectionObserver | null = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(
      (entries) => {
        isIntersecting = entries[0]?.isIntersecting ?? true;
        if (isIntersecting && !document.hidden) start();
        else stop();
      },
      { threshold: 0.01 }
    );
    io.observe(canvas);
  }

  resize();
  window.addEventListener('resize', onResize);
  document.addEventListener('visibilitychange', onVisibility);
  if (finePointer) {
    canvas.addEventListener('pointermove', onPointerMove);
    canvas.addEventListener('pointerleave', onPointerLeave);
  }

  if (reducedMotion) {
    // Render exactly one still frame — no rAF loop, no motion, ever.
    step();
  } else {
    start();
  }

  return {
    setIntensity(value: number) {
      intensity = Math.max(0, Math.min(1, value));
    },
    destroy() {
      stop();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibility);
      canvas.removeEventListener('pointermove', onPointerMove);
      canvas.removeEventListener('pointerleave', onPointerLeave);
      io?.disconnect();
    },
  };
}
