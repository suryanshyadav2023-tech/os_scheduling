// animation.js — Handles FCFS Gantt Chart Animation

let animationFrame;
let currentTime = 0;
let processes = [];
let ctx;
let canvas;
let isAnimating = false;

/**
 * Run the FCFS Gantt Chart Animation
 * @param {Array} trace - Execution trace from algorithm.js
 * Example: [{ name: 'P1', start: 0, end: 5 }, { name: 'P2', start: 5, end: 9 }]
 */
function runFCFSAnimation(trace) {
  // Stop any running animation first
  cancelAnimationFrame(animationFrame);
  isAnimating = false;

  // Initialize canvas
  canvas = document.getElementById("scheduler-canvas");
  ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  processes = trace;
  currentTime = 0;

  // Compute total time
  const totalTime = processes[processes.length - 1].end;
  const unitWidth = (canvas.width - 100) / totalTime; // pixels per time unit
  const yBase = 100;

  // Pre-draw timeline base
  ctx.font = "14px Segoe UI";
  ctx.fillStyle = "#004d99";
  ctx.fillText("Time (ms)", 30, 30);
  ctx.lineWidth = 2;
  ctx.strokeStyle = "#004d99";
  ctx.beginPath();
  ctx.moveTo(50, yBase);
  ctx.lineTo(canvas.width - 50, yBase);
  ctx.stroke();

  // Draw time markers
  for (let t = 0; t <= totalTime; t++) {
    const x = 50 + t * unitWidth;
    ctx.strokeStyle = "#aaa";
    ctx.beginPath();
    ctx.moveTo(x, yBase - 5);
    ctx.lineTo(x, yBase + 5);
    ctx.stroke();
    ctx.fillStyle = "#333";
    ctx.fillText(t.toString(), x - 5, yBase + 20);
  }

  // Start animation
  isAnimating = true;
  animateGantt(trace, totalTime, unitWidth, yBase);
}

function animateGantt(trace, totalTime, unitWidth, yBase) {
  if (!isAnimating) return;

  const barHeight = 50;
  const colors = [
    "#4e79a7",
    "#f28e2b",
    "#e15759",
    "#76b7b2",
    "#59a14f",
    "#edc948",
    "#b07aa1",
    "#ff9da7",
    "#9c755f",
    "#bab0ab"
  ];

  // Clear previous frame (except timeline)
  ctx.clearRect(50, yBase - barHeight - 10, canvas.width - 100, barHeight + 20);

  // Draw bars up to current time
  let xStart = 50;
  for (let i = 0; i < trace.length; i++) {
    const { name, start, end } = trace[i];
    if (currentTime >= start) {
      const executedTime = Math.min(currentTime, end) - start;
      const width = executedTime * unitWidth;

      ctx.fillStyle = colors[i % colors.length];
      ctx.fillRect(xStart + start * unitWidth, yBase - barHeight, width, barHeight);

      // Label process name
      if (width > 20) {
        ctx.fillStyle = "#fff";
        ctx.font = "14px Segoe UI";
        ctx.fillText(name, xStart + start * unitWidth + 5, yBase - barHeight / 2);
      }

      // Mark process completion
      if (currentTime >= end) {
        ctx.fillStyle = "#000";
        ctx.font = "12px Segoe UI";
        ctx.fillText(`Done`, xStart + end * unitWidth - 30, yBase - barHeight - 5);
      }
    }
  }

  // Draw current time marker
  const currentX = 50 + currentTime * unitWidth;
  ctx.strokeStyle = "#d9534f";
  ctx.beginPath();
  ctx.moveTo(currentX, yBase - barHeight - 10);
  ctx.lineTo(currentX, yBase + 10);
  ctx.stroke();

  // Increment time
  currentTime += 0.05; // controls animation speed

  if (currentTime <= totalTime) {
    animationFrame = requestAnimationFrame(() => animateGantt(trace, totalTime, unitWidth, yBase));
  } else {
    isAnimating = false;
  }
}

/**
 * Stop animation manually (if needed)
 */
function stopAnimation() {
  isAnimating = false;
  cancelAnimationFrame(animationFrame);
}
