const canvas = document.getElementById('scheduler-canvas');
const ctx = canvas.getContext('2d');
let animationFrameId = null;
let currentTraceStep = 0;
let animationSpeed = 500;

function initAnimation(trace) {
    if (trace.length === 0) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentTraceStep = 0;

    document.getElementById('play-btn').onclick = startAnimation;
    document.getElementById('pause-btn').onclick = pauseAnimation;
    document.getElementById('step-forward-btn').onclick = () => stepAnimation(1);
    document.getElementById('step-backward-btn').onclick = () => stepAnimation(-1);
    document.getElementById('speed').onchange = (e) => {
        animationSpeed = parseInt(e.target.value);
    };

    renderFrame(trace[currentTraceStep]);
}

function startAnimation() {
    if (animationFrameId) return;
    document.getElementById('play-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    animateLoop();
}

function pauseAnimation() {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
    document.getElementById('play-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
}

function stepAnimation(dir) {
    pauseAnimation();
    const newStep = currentTraceStep + dir;
    if (newStep >= 0 && newStep < executionTrace.length) {
        currentTraceStep = newStep;
        renderFrame(executionTrace[currentTraceStep]);
    }
}

function animateLoop() {
    if (currentTraceStep >= executionTrace.length) {
        pauseAnimation();
        return;
    }
    renderFrame(executionTrace[currentTraceStep]);
    currentTraceStep++;
    setTimeout(() => {
        animationFrameId = requestAnimationFrame(animateLoop);
    }, animationSpeed);
}

// --- Rendering ---
function getProcessColor(pid) {
    const hash = pid.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0'];
    return colors[hash % colors.length];
}

function renderFrame(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const maxTime = executionTrace.length - 1;
    renderGanttChart(state.time);
    renderTimeScale(maxTime);
    updateStatsPanel(state);
    updateProcessStates(state);
    document.getElementById('step-backward-btn').disabled = state.time === 0;
    document.getElementById('step-forward-btn').disabled = state.time === maxTime;
}

function renderGanttChart(currentTime) {
    const barHeight = 60, yStart = 40;
    const padding = 50; // Extra space for 0th and last second
    const timeUnitWidth = (canvas.width - padding * 2) / (executionTrace.length - 1);

    calculatedProcesses.forEach(p => {
        const actualStart = p.start;
        const actualFinish = Math.min(p.finish, currentTime);
        if (actualFinish > actualStart) {
            const xStart = padding + actualStart * timeUnitWidth;
            const width = (actualFinish - actualStart) * timeUnitWidth;

            ctx.fillStyle = getProcessColor(p.id);
            ctx.fillRect(xStart, yStart, width, barHeight);

            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(p.id, xStart + 5, yStart + 35);
        }
    });

    // Time pointer
    const xPointer = padding + currentTime * timeUnitWidth;
    ctx.fillStyle = 'red';
    ctx.beginPath();
    ctx.moveTo(xPointer, 20);
    ctx.lineTo(xPointer - 5, 10);
    ctx.lineTo(xPointer + 5, 10);
    ctx.closePath();
    ctx.fill();
    ctx.fillText(`t=${currentTime}`, xPointer - 15, 35);
}

function renderTimeScale(maxTime) {
    const yAxis = 110;
    const padding = 50;
    const timeUnitWidth = (canvas.width - padding * 2) / maxTime;

    ctx.strokeStyle = '#999';
    ctx.beginPath();
    ctx.moveTo(padding, yAxis);
    ctx.lineTo(canvas.width - padding, yAxis);
    ctx.stroke();

    ctx.fillStyle = '#bbb';
    ctx.font = '12px Arial';

    for (let t = 0; t <= maxTime; t++) {
        const x = padding + t * timeUnitWidth;
        ctx.beginPath();
        ctx.moveTo(x, yAxis);
        ctx.lineTo(x, yAxis + 5);
        ctx.stroke();
        ctx.fillText(t, x - 5, yAxis + 20);
    }
}



// --- Ready Queue, Running, Completed ---
function updateProcessStates(state) {
    const readyQueueDiv = document.getElementById('ready-queue-display');
    const statsDiv = document.getElementById('statistics');

    // Ready Queue
    if (state.readyQueue.length > 0) {
        readyQueueDiv.innerHTML = state.readyQueue.map(pid =>
            `<span style="background-color: #FFC107; padding: 4px 8px; margin-right: 6px; border-radius: 5px; font-weight: 500;">${pid}</span>`
        ).join('');
    } else readyQueueDiv.innerHTML = '<em>Ready Queue Empty</em>';

    // Running
    const runningDisplay = state.runningProcess
        ? `<strong style="color: #4CAF50;">Running:</strong> ${state.runningProcess}`
        : (state.time === executionTrace.length - 1
            ? '<strong style="color: #2196F3;">Simulation Complete</strong>'
            : '<strong style="color: #E91E63;">CPU Idle / Transition</strong>');

    // Completed
    const completedDisplay = state.completedProcesses.length > 0
        ? `<strong>Completed:</strong> ${state.completedProcesses.map(pid =>
            `<span style="background-color: #9E9E9E; color: white; padding: 3px 6px; border-radius: 3px; margin-right: 5px;">${pid}</span>`
        ).join('')}`
        : `<strong>Completed:</strong> None`;

    const infoHTML = `
        <div style="margin-top: 10px;">
            <p>${runningDisplay}</p>
            <p>${completedDisplay}</p>
        </div>
    `;

    statsDiv.querySelectorAll('div.dynamic-info').forEach(el => el.remove());
    const wrapper = document.createElement('div');
    wrapper.classList.add('dynamic-info');
    wrapper.innerHTML = infoHTML;
    statsDiv.appendChild(wrapper);
}

// --- Stats Panel ---
function updateStatsPanel(state) {
    let totalWaiting = 0, totalTurnaround = 0, done = 0;
    calculatedProcesses.forEach(p => {
        if (p.finish <= state.time) {
            totalWaiting += p.waiting;
            totalTurnaround += p.turnaround;
            done++;
        }
    });
    const avgW = done ? (totalWaiting / done).toFixed(2) : 'N/A';
    const avgT = done ? (totalTurnaround / done).toFixed(2) : 'N/A';
    document.getElementById('current-time').textContent = state.time;
    document.getElementById('avg-waiting-time').textContent = avgW;
    document.getElementById('avg-turnaround-time').textContent = avgT;
}

// --- Export Screenshot ---
function exportScreenshot() {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'fcfs_trace.png';
    link.href = dataURL;
    link.click();
    console.log('Screenshot exported.');
}
