/**
 * Client Dashboard - Full-Screen Fluid Waves + Particle Flow
 * Professional, calm, and trustworthy aesthetic.
 */

class ClientFluid {
    constructor() {
        this.canvas = document.getElementById('client-fluid');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 50;
        this.waves = [
            { y: 0.8, color: 'rgba(14, 184, 166, 0.06)', speed: 0.01, amplitude: 25, offset: 0 },
            { y: 0.85, color: 'rgba(30, 118, 110, 0.08)', speed: 0.015, amplitude: 20, offset: 2 },
            { y: 0.9, color: 'rgba(255, 255, 255, 0.05)', speed: 0.008, amplitude: 15, offset: 4 }
        ];

        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }

    init() {
        this.resize();
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new FluidParticle(this.width, this.height));
        }
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    drawWaves(time) {
        this.waves.forEach(wave => {
            this.ctx.beginPath();
            this.ctx.moveTo(0, this.height);

            for (let x = 0; x <= this.width; x += 10) {
                const y = Math.sin(x * 0.002 + time * wave.speed + wave.offset) * wave.amplitude + this.height * wave.y;
                this.ctx.lineTo(x, y);
            }

            this.ctx.lineTo(this.width, this.height);
            this.ctx.fillStyle = wave.color;
            this.ctx.fill();
        });
    }

    animate() {
        const time = Date.now() * 0.05;
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Background waves
        this.drawWaves(time);

        // Drifting particles
        this.particles.forEach(p => {
            p.update(this.width, this.height);
            p.draw(this.ctx);
        });

        requestAnimationFrame(() => this.animate());
    }
}

class FluidParticle {
    constructor(w, h) {
        this.init(w, h, true);
    }

    init(w, h, randomY = false) {
        this.x = Math.random() * w;
        this.y = randomY ? Math.random() * h : -10;
        this.size = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.2) * 0.3 + 0.5; // Drift right
        this.vy = (Math.random() * 0.2) + 0.3; // Drift down
        this.opacity = Math.random() * 0.1 + 0.05;
    }

    update(w, h) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x > w + 10 || this.y > h + 10) {
            this.init(w, h);
            if (Math.random() > 0.5) {
                this.x = -10;
                this.y = Math.random() * h;
            } else {
                this.x = Math.random() * w;
                this.y = -10;
            }
        }
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(14, 184, 166, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize on load
window.addEventListener('load', () => {
    new ClientFluid();
});
