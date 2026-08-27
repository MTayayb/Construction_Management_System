/**
 * Engineer Dashboard - Technical Flow Grid + Particle Streams
 * Professional, precise, and systematic aesthetic.
 */

class EngineerTechnical {
    constructor() {
        this.canvas = document.getElementById('engineer-technical');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 40;
        this.gridSize = 60;
        this.baseColor = '4, 120, 87'; // Deep emerald from theme
        this.accentColor = '16, 185, 129'; // Vibrant teal-green

        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }

    init() {
        this.resize();
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new TechParticle(this.width, this.height, this.accentColor));
        }
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    drawGrid(offsetX, offsetY) {
        this.ctx.strokeStyle = `rgba(${this.baseColor}, 0.08)`;
        this.ctx.lineWidth = 1;

        // Vertical lines
        for (let x = offsetX % this.gridSize; x < this.width; x += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.height);
            this.ctx.stroke();
        }

        // Horizontal lines
        for (let y = offsetY % this.gridSize; y < this.height; y += this.gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.width, y);
            this.ctx.stroke();
        }
    }

    animate() {
        const time = Date.now() * 0.001;
        const offsetX = time * 20; // slow drift
        const offsetY = time * 20;

        this.ctx.clearRect(0, 0, this.width, this.height);

        // Technical Grid
        this.drawGrid(offsetX, offsetY);

        // Flowing Nodes/Particles
        this.particles.forEach(p => {
            p.update(this.width, this.height);
            p.draw(this.ctx, time);
        });

        requestAnimationFrame(() => this.animate());
    }
}

class TechParticle {
    constructor(w, h, color) {
        this.init(w, h);
        this.color = color;
    }

    init(w, h) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.2) * 0.5 + 0.5; // Drift predominantly SE
        this.vy = (Math.random() - 0.2) * 0.5 + 0.5;
        this.pulseSeed = Math.random() * Math.PI;
    }

    update(w, h) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x > w + 20) this.x = -20;
        if (this.y > h + 20) this.y = -20;
    }

    draw(ctx, time) {
        const pulse = Math.sin(time * 2 + this.pulseSeed) * 0.3 + 0.7; // 0.4 to 1.0 opacity pulse
        ctx.fillStyle = `rgba(${this.color}, ${pulse * 0.15})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size * pulse, 0, Math.PI * 2);
        ctx.fill();

        // Optional faint glow
        ctx.shadowBlur = 5;
        ctx.shadowColor = `rgba(${this.color}, 0.2)`;
        ctx.fill();
        ctx.shadowBlur = 0;
    }
}

// Initialize on load
window.addEventListener('load', () => {
    new EngineerTechnical();
});
