/**
 * Admin Dashboard - Professional Particle Motion
 * Professional data-flow aesthetic with floating points and faint connections.
 */

class AdminParticles {
    constructor() {
        this.canvas = document.getElementById('admin-particles');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.particles = [];
        this.particleCount = 60;
        this.baseColor = '37, 99, 235'; // Professional Blue (#2563EB)
        this.connectionDist = 150;

        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }

    init() {
        this.resize();
        for (let i = 0; i < this.particleCount; i++) {
            this.particles.push(new Particle(this.width, this.height, this.baseColor));
        }
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    drawConnections() {
        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const dx = this.particles[i].x - this.particles[j].x;
                const dy = this.particles[i].y - this.particles[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < this.connectionDist) {
                    const opacity = (1 - dist / this.connectionDist) * 0.06;
                    this.ctx.strokeStyle = `rgba(30, 64, 175, ${opacity})`; // Deep Indigo
                    this.ctx.lineWidth = 0.5;
                    this.ctx.beginPath();
                    this.ctx.moveTo(this.particles[i].x, this.particles[i].y);
                    this.ctx.lineTo(this.particles[j].x, this.particles[j].y);
                    this.ctx.stroke();
                }
            }
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        this.drawConnections();

        this.particles.forEach(p => {
            p.update(this.width, this.height);
            p.draw(this.ctx);
        });

        requestAnimationFrame(() => this.animate());
    }
}

class Particle {
    constructor(w, h, color) {
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.size = Math.random() * 2 + 1;
        this.vx = (Math.random() - 0.5) * 0.5 + 0.2; // Slow diagonal drift
        this.vy = (Math.random() - 0.5) * 0.5 - 0.3; // Upward drift
        this.color = color;
        this.opacity = Math.random() * 0.15 + 0.1; // Slightly more visible particles
    }

    update(w, h) {
        this.x += this.vx;
        this.y += this.vy;

        // Reset if off screen
        if (this.x < -10) this.x = w + 10;
        if (this.x > w + 10) this.x = -10;
        if (this.y < -10) this.y = h + 10;
        if (this.y > h + 10) this.y = -10;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(${this.color}, ${this.opacity})`;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize on load
window.addEventListener('load', () => {
    new AdminParticles();
});
