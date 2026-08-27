document.addEventListener("DOMContentLoaded", () => {
    const smokeContainer = document.createElement("div");
    smokeContainer.classList.add("smoke-container");
    document.body.prepend(smokeContainer);

    const style = document.createElement("style");
    style.innerHTML = `
    .smoke-container {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: -1;
      overflow: hidden;
      background: radial-gradient(circle at 50% 50%, #ffffff, #e0e0e0);
    }
    
    .smoke-puff {
      position: absolute;
      bottom: -100px;
      width: 300px;
      height: 300px;
      background: radial-gradient(circle, rgba(0,0,0,0.05) 0%, transparent 70%);
      filter: blur(20px);
      border-radius: 50%;
      animation: floatUp 15s linear infinite;
    }

    @keyframes floatUp {
      0% { transform: translateY(0) scale(1) translateX(0); opacity: 0; }
      20% { opacity: 0.4; }
      80% { opacity: 0.2; }
      100% { transform: translateY(-120vh) scale(2) translateX(50px); opacity: 0; }
    }
  `;
    document.head.appendChild(style);

    function createPuff() {
        const puff = document.createElement("div");
        puff.classList.add("smoke-puff");

        // Randomize properties
        const left = Math.random() * 100;
        const size = 200 + Math.random() * 300;
        const duration = 10 + Math.random() * 15;
        const delay = Math.random() * 5;

        puff.style.left = `${left}%`;
        puff.style.width = `${size}px`;
        puff.style.height = `${size}px`;
        puff.style.animationDuration = `${duration}s`;
        puff.style.animationDelay = `${delay}s`;

        smokeContainer.appendChild(puff);

        // Remove after animation
        setTimeout(() => {
            puff.remove();
        }, (duration + delay) * 1000);
    }

    // Initial puff
    for (let i = 0; i < 15; i++) {
        createPuff();
    }

    // Ongoing creation
    setInterval(createPuff, 800);
});
