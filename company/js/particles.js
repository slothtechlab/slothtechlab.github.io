/**
 * Particle System - Ensemble, Inc.
 * チームラボ風の有機的パーティクルネットワーク
 * Canvas 2D で高パフォーマンスを実現
 */

class ParticleSystem {
  constructor(canvasId) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.mouse = { x: -1000, y: -1000 };
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.animationId = null;
    this.time = 0;

    // Configuration
    this.config = {
      particleCount: 0,       // will be set in resize
      connectionDistance: 150,
      mouseRadius: 200,
      mouseForce: 0.08,
      baseSpeed: 0.15,
      colors: [
        'rgba(59, 130, 246, ',    // blue
        'rgba(96, 165, 250, ',    // light blue
        'rgba(139, 92, 246, ',    // purple
        'rgba(99, 102, 241, ',    // indigo
        'rgba(147, 197, 253, ',   // sky
      ],
      bgColor: '#060a14',
    };

    this.init();
  }

  init() {
    this.resize();
    this.createParticles();
    this.bindEvents();
    this.animate();
  }

  resize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = this.width + 'px';
    this.canvas.style.height = this.height + 'px';
    this.ctx.scale(this.dpr, this.dpr);

    // Responsive particle count
    const area = this.width * this.height;
    this.config.particleCount = Math.min(Math.floor(area / 8000), 200);
    this.config.connectionDistance = Math.min(this.width * 0.12, 150);
  }

  createParticles() {
    this.particles = [];
    for (let i = 0; i < this.config.particleCount; i++) {
      this.particles.push(this.createParticle());
    }
  }

  createParticle(x, y) {
    const colorIdx = Math.floor(Math.random() * this.config.colors.length);
    return {
      x: x || Math.random() * this.width,
      y: y || Math.random() * this.height,
      vx: (Math.random() - 0.5) * this.config.baseSpeed * 2,
      vy: (Math.random() - 0.5) * this.config.baseSpeed * 2,
      radius: Math.random() * 2 + 0.5,
      baseRadius: Math.random() * 2 + 0.5,
      colorIdx: colorIdx,
      alpha: Math.random() * 0.5 + 0.2,
      baseAlpha: Math.random() * 0.5 + 0.2,
      phase: Math.random() * Math.PI * 2,
      pulseSpeed: Math.random() * 0.02 + 0.005,
      // Organic movement
      noiseOffsetX: Math.random() * 1000,
      noiseOffsetY: Math.random() * 1000,
    };
  }

  bindEvents() {
    window.addEventListener('resize', () => {
      this.resize();
      this.createParticles();
    });

    window.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });

    window.addEventListener('touchmove', (e) => {
      if (e.touches.length > 0) {
        this.mouse.x = e.touches[0].clientX;
        this.mouse.y = e.touches[0].clientY;
      }
    }, { passive: true });

    window.addEventListener('mouseleave', () => {
      this.mouse.x = -1000;
      this.mouse.y = -1000;
    });
  }

  // Simple noise function
  noise(x) {
    const sin1 = Math.sin(x * 1.1) * 0.5;
    const sin2 = Math.sin(x * 2.3 + 1.7) * 0.3;
    const sin3 = Math.sin(x * 3.7 + 2.9) * 0.2;
    return sin1 + sin2 + sin3;
  }

  updateParticle(p) {
    this.time += 0.0001;

    // Organic sine-based movement
    const nx = this.noise(p.noiseOffsetX + this.time * 30);
    const ny = this.noise(p.noiseOffsetY + this.time * 30);
    p.vx += nx * 0.003;
    p.vy += ny * 0.003;

    // Mouse interaction
    const dx = this.mouse.x - p.x;
    const dy = this.mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < this.config.mouseRadius) {
      const force = (this.config.mouseRadius - dist) / this.config.mouseRadius;
      // Gentle attraction + orbital motion
      p.vx += dx * force * this.config.mouseForce * 0.01;
      p.vy += dy * force * this.config.mouseForce * 0.01;
      // Add slight orbital rotation
      p.vx += -dy * force * 0.001;
      p.vy += dx * force * 0.001;
    }

    // Damping
    p.vx *= 0.98;
    p.vy *= 0.98;

    // Speed limit
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > 1) {
      p.vx = (p.vx / speed) * 1;
      p.vy = (p.vy / speed) * 1;
    }

    // Update position
    p.x += p.vx;
    p.y += p.vy;

    // Wrap around edges with smooth transition
    const margin = 50;
    if (p.x < -margin) p.x = this.width + margin;
    if (p.x > this.width + margin) p.x = -margin;
    if (p.y < -margin) p.y = this.height + margin;
    if (p.y > this.height + margin) p.y = -margin;

    // Pulsing
    p.phase += p.pulseSpeed;
    p.radius = p.baseRadius + Math.sin(p.phase) * 0.5;
    p.alpha = p.baseAlpha + Math.sin(p.phase * 0.7) * 0.1;
  }

  drawConnections() {
    const maxDist = this.config.connectionDistance;

    for (let i = 0; i < this.particles.length; i++) {
      for (let j = i + 1; j < this.particles.length; j++) {
        const a = this.particles[i];
        const b = this.particles[j];
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < maxDist) {
          const opacity = (1 - dist / maxDist) * 0.15;
          this.ctx.beginPath();
          this.ctx.moveTo(a.x, a.y);
          this.ctx.lineTo(b.x, b.y);
          this.ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }

    // Mouse connections
    if (this.mouse.x > 0) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        const dx = this.mouse.x - p.x;
        const dy = this.mouse.y - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < this.config.mouseRadius) {
          const opacity = (1 - dist / this.config.mouseRadius) * 0.2;
          this.ctx.beginPath();
          this.ctx.moveTo(p.x, p.y);
          this.ctx.lineTo(this.mouse.x, this.mouse.y);
          this.ctx.strokeStyle = `rgba(96, 165, 250, ${opacity})`;
          this.ctx.lineWidth = 0.5;
          this.ctx.stroke();
        }
      }
    }
  }

  drawParticles() {
    for (const p of this.particles) {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.config.colors[p.colorIdx] + p.alpha + ')';
      this.ctx.fill();

      // Glow effect for larger particles
      if (p.baseRadius > 1.5) {
        this.ctx.beginPath();
        this.ctx.arc(p.x, p.y, p.radius * 3, 0, Math.PI * 2);
        this.ctx.fillStyle = this.config.colors[p.colorIdx] + (p.alpha * 0.1) + ')';
        this.ctx.fill();
      }
    }
  }

  // Ambient glow spots
  drawAmbientGlow() {
    const glowTime = Date.now() * 0.0003;

    // Slow-moving large glow orbs
    const glows = [
      {
        x: this.width * 0.3 + Math.sin(glowTime * 0.7) * 100,
        y: this.height * 0.4 + Math.cos(glowTime * 0.5) * 80,
        r: 300,
        color: 'rgba(59, 130, 246, 0.015)',
      },
      {
        x: this.width * 0.7 + Math.cos(glowTime * 0.6) * 120,
        y: this.height * 0.6 + Math.sin(glowTime * 0.4) * 100,
        r: 250,
        color: 'rgba(139, 92, 246, 0.012)',
      },
      {
        x: this.width * 0.5 + Math.sin(glowTime * 0.8) * 80,
        y: this.height * 0.2 + Math.cos(glowTime * 0.3) * 60,
        r: 200,
        color: 'rgba(96, 165, 250, 0.01)',
      },
    ];

    for (const g of glows) {
      const gradient = this.ctx.createRadialGradient(g.x, g.y, 0, g.x, g.y, g.r);
      gradient.addColorStop(0, g.color);
      gradient.addColorStop(1, 'transparent');
      this.ctx.fillStyle = gradient;
      this.ctx.fillRect(g.x - g.r, g.y - g.r, g.r * 2, g.r * 2);
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    this.drawAmbientGlow();

    for (const p of this.particles) {
      this.updateParticle(p);
    }

    this.drawConnections();
    this.drawParticles();

    this.animationId = requestAnimationFrame(() => this.animate());
  }

  destroy() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
    }
  }
}

// Export
window.ParticleSystem = ParticleSystem;
