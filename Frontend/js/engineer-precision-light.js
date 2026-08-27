/**
 * Engineer Dashboard - Precision Light
 * Elegant flowing lines and pulsing nodes for a professional corporate aesthetic.
 */

class PrecisionLight {
    constructor() {
        this.canvas = document.getElementById('engineer-precision-light');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.lines = [];
        this.lineCount = 15;
        this.baseColor = '34, 197, 94'; // Vibrant Emerald Green
        this.nodeColor = '22, 163, 74'; // Deep Green

        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }

    init() {
        this.resize();
        for (let i = 0; i < this.lineCount; i++) {
            this.lines.push(new FlowLine(this.width, this.height));
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

        // Slight subtle wave motion behind lines
        this.ctx.fillStyle = 'rgba(167, 243, 208, 0.05)';
        this.ctx.beginPath();
        const time = Date.now() * 0.001;
        this.ctx.moveTo(0, this.height);
        for (let x = 0; x <= this.width; x += 50) {
            const y = Math.sin(x * 0.001 + time * 0.5) * 20 + this.height * 0.8;
            this.ctx.lineTo(x, y);
        }
        this.ctx.lineTo(this.width, this.height);
        this.ctx.fill();

        this.lines.forEach(line => {
            line.update(this.width, this.height);
            line.draw(this.ctx, this.baseColor, this.nodeColor);
        });

        requestAnimationFrame(() => this.animate());
    }
}

class FlowLine {
    constructor(w, h) {
        this.reset(w, h);
    }

    reset(w, h) {
        this.points = [];
        const startX = -100;
        const startY = Math.random() * h;
        const segments = 10;
        const segmentLen = (w + 200) / segments;

        for (let i = 0; i <= segments; i++) {
            this.points.push({
                x: startX + i * segmentLen,
                y: startY + (Math.random() - 0.5) * 150,
                originalY: startY
            });
        }

        this.speed = Math.random() * 0.5 + 0.2;
        this.opacity = Math.random() * 0.12 + 0.05;
        this.nodePos = Math.random();
        this.nodePulse = Math.random() * Math.PI;
    }

    update(w, h) {
        this.points.forEach(p => {
            p.x += this.speed;
        });

        if (this.points[0].x > w + 100) {
            this.reset(w, h);
        }

        this.nodePulse += 0.05;
    }

    draw(ctx, lc, nc) {
        ctx.beginPath();
        ctx.strokeStyle = `rgba(${lc}, ${this.opacity})`;
        ctx.lineWidth = 1;

        ctx.moveTo(this.points[0].x, this.points[0].y);
        for (let i = 1; i < this.points.length - 2; i++) {
            const xc = (this.points[i].x + this.points[i + 1].x) / 2;
            const yc = (this.points[i].y + this.points[i + 1].y) / 2;
            ctx.quadraticCurveTo(this.points[i].x, this.points[i].y, xc, yc);
        }
        ctx.stroke();

        // Draw node
        const nodeIdx = Math.floor(this.nodePos * (this.points.length - 1));
        const nodeX = this.points[nodeIdx].x;
        const nodeY = this.points[nodeIdx].y;
        const pulse = Math.sin(this.nodePulse) * 0.2 + 1;

        ctx.fillStyle = `rgba(${nc}, 0.15)`;
        ctx.beginPath();
        ctx.arc(nodeX, nodeY, 3 * pulse, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Initialize on load
window.addEventListener('load', () => {
    new PrecisionLight();
});
