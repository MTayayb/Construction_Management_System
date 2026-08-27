/**
 * Worker Dashboard - Industrial Light & Amber Flow
 * Action-oriented, rugged, and professional energy flow animation.
 */

class WorkerEnergy {
    constructor() {
        this.canvas = document.getElementById('worker-energy');
        if (!this.canvas) return;

        this.ctx = this.canvas.getContext('2d');
        this.lines = [];
        this.lineCount = 14; // Slightly more for depth
        this.primaryColor = '249, 115, 22'; // Vibrant orange
        this.secondaryColor = '253, 186, 116'; // Soft amber
        this.depthColor = '220, 38, 38'; // Industrial red

        this.init();
        this.animate();
        window.addEventListener('resize', () => this.resize());
    }

    init() {
        this.resize();
        for (let i = 0; i < this.lineCount; i++) {
            // Layered lines: some orange, some faint red
            const isDepth = i % 3 === 0;
            this.lines.push(new EnergyLine(this.width, this.height, isDepth));
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

        const time = Date.now() * 0.001;

        this.lines.forEach(line => {
            line.update(this.width, this.height);
            const color = line.isDepth ? this.depthColor : this.primaryColor;
            const nodeColor = line.isDepth ? this.depthColor : this.secondaryColor;
            line.draw(this.ctx, color, nodeColor, time);
        });

        requestAnimationFrame(() => this.animate());
    }
}

class EnergyLine {
    constructor(w, h, isDepth) {
        this.isDepth = isDepth;
        this.reset(w, h);
    }

    reset(w, h) {
        this.x = Math.random() * w - 200;
        this.y = -100;
        this.length = Math.random() * 800 + 400;
        this.width = this.isDepth ? Math.random() * 1.5 + 0.5 : Math.random() * 3 + 1;
        this.speed = this.isDepth ? Math.random() * 0.5 + 0.3 : Math.random() * 1.2 + 0.7;
        this.opacity = this.isDepth ? Math.random() * 0.04 + 0.02 : Math.random() * 0.08 + 0.04;
        this.angle = Math.PI / 4; // 45 degrees

        // Activity nodes along this line
        this.nodePos = Math.random();
        this.nodePulseOffset = Math.random() * Math.PI * 2;
    }

    update(w, h) {
        this.x += this.speed;
        this.y += this.speed;

        if (this.y > h + 200) {
            this.reset(w, h);
            this.y = -200;
            this.x = Math.random() * w - 400;
        }
    }

    draw(ctx, bc, ac, time) {
        const x2 = this.x + Math.cos(this.angle) * this.length;
        const y2 = this.y + Math.sin(this.angle) * this.length;

        // Draw the energy line
        ctx.beginPath();
        const gradient = ctx.createLinearGradient(this.x, this.y, x2, y2);
        gradient.addColorStop(0, `rgba(${bc}, 0)`);
        gradient.addColorStop(0.5, `rgba(${bc}, ${this.opacity})`);
        gradient.addColorStop(1, `rgba(${bc}, 0)`);

        ctx.strokeStyle = gradient;
        ctx.lineWidth = this.width;
        ctx.moveTo(this.x, this.y);
        ctx.lineTo(x2, y2);
        ctx.stroke();

        // Pulsing nodes only on primary lines for focus
        if (!this.isDepth) {
            const nodeX = this.x + Math.cos(this.angle) * this.length * this.nodePos;
            const nodeY = this.y + Math.sin(this.angle) * this.length * this.nodePos;
            const pulse = Math.sin(time * 3 + this.nodePulseOffset) * 0.2 + 1;

            ctx.fillStyle = `rgba(${ac}, ${this.opacity * 1.5})`;
            ctx.beginPath();
            ctx.arc(nodeX, nodeY, 3.5 * pulse, 0, Math.PI * 2);
            ctx.fill();

            ctx.shadowBlur = 8;
            ctx.shadowColor = `rgba(${ac}, 0.2)`;
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    }
}

// Initialize on load
window.addEventListener('load', () => {
    new WorkerEnergy();
});
