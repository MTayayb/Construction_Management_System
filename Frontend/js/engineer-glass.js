/**
 * Engineer Dashboard - Glass Precision
 * Modern SaaS aesthetic with drifting glass-like panels and soft light rays.
 */

class GlassPrecision {
    constructor() {
        this.canvas = document.getElementById('engineer-glass');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.panels = [];
        this.rays = [];
        this.nodes = [];
        this.panelCount = 8;
        this.rayCount = 5;
        this.nodeColor = '22, 163, 74'; // Deep emerald

        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }

    init() {
        this.resize();

        // Initialize Panels
        for (let i = 0; i < this.panelCount; i++) {
            this.panels.push(new GlassPanel(this.width, this.height));
        }

        // Initialize Rays
        for (let i = 0; i < this.rayCount; i++) {
            this.rays.push(new LightRay(this.width, this.height));
        }
    }

    resize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
    }

    animate() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw Panels
        this.panels.forEach(p => {
            p.update(this.width, this.height);
            p.draw(this.ctx);
        });

        // Draw Rays
        this.rays.forEach(r => {
            r.update(this.width, this.height);
            r.draw(this.ctx);
        });

        requestAnimationFrame(() => this.animate());
    }
}

class GlassPanel {
    constructor(w, h) {
        this.reset(w, h);
    }

    reset(w, h) {
        this.w = Math.random() * 300 + 100;
        this.h = Math.random() * 300 + 100;
        this.x = Math.random() * w;
        this.y = Math.random() * h;
        this.vx = (Math.random() - 0.2) * 0.3 + 0.2;
        this.vy = (Math.random() - 0.2) * 0.3 + 0.2;
        this.opacity = Math.random() * 0.05 + 0.03;
    }

    update(w, h) {
        this.x += this.vx;
        this.y += this.vy;

        if (this.x > w) this.x = -this.w;
        if (this.y > h) this.y = -this.h;
    }

    draw(ctx) {
        ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`;
        ctx.strokeStyle = `rgba(34, 197, 94, 0.05)`;
        ctx.lineWidth = 1;

        ctx.beginPath();
        ctx.roundRect(this.x, this.y, this.w, this.h, 10);
        ctx.fill();
        ctx.stroke();
    }
}

class LightRay {
    constructor(w, h) {
        this.reset(w, h);
    }

    reset(w, h) {
        this.x = Math.random() * w;
        this.y = -200;
        this.length = Math.random() * 600 + 400;
        this.width = Math.random() * 2 + 1;
        this.speed = Math.random() * 1 + 0.5;
        this.angle = Math.PI / 4; // 45 degrees
        this.opacity = Math.random() * 0.03 + 0.02;
    }

    update(w, h) {
        this.x += this.speed;
        this.y += this.speed;

        if (this.y > h + 200) {
            this.x = Math.random() * w - 500;
            this.y = -200;
        }
    }

    draw(ctx) {
        const x2 = this.x + Math.cos(this.angle) * this.length;
        const y2 = this.y + Math.sin(this.angle) * this.length;

        const gradient = ctx.createLinearGradient(this.x, this.y, x2, y2);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 0)');
        gradient.addColorStop(0.5, `rgba(255, 255, 255, ${this.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.width;
        ctx.beginPath();
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
}

// Initialize on load
window.addEventListener('load', () => {
    new GlassPrecision();
});
