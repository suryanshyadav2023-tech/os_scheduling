let calculatedProcesses = [];
let executionTrace = [];
const canvas = document.getElementById('scheduler-canvas');
const ctx = canvas.getContext('2d');
let animationFrameId = null;
let currentTraceStep = 0;
let animationSpeed = 500;
let processCounter = 4;

function initAnimation(trace, processes) {
    if (trace.length === 0) return;

    executionTrace = trace;
    calculatedProcesses = processes;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    currentTraceStep = 0;

    document.getElementById('play-btn').onclick = startAnimation;
    document.getElementById('pause-btn').onclick = pauseAnimation;
    document.getElementById('step-forward-btn').onclick = () => stepAnimation(1);
    document.getElementById('step-backward-btn').onclick = () => stepAnimation(-1);
    document.getElementById('speed').onchange = (e) => { 
        animationSpeed = Math.max(1, parseInt(e.target.value)); 
    };

    if (executionTrace.length > 0) {
        renderFrame(executionTrace[currentTraceStep]);
    }
}

function startAnimation() {
    if (animationFrameId || executionTrace.length === 0) return; 

    document.getElementById('play-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;

    animateLoop();
}

function pauseAnimation() {
    clearTimeout(animationFrameId);
    animationFrameId = null;

    document.getElementById('play-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
}

function stepAnimation(direction) {
    pauseAnimation();

    const newStep = currentTraceStep + direction;

    if (newStep >= 0 && newStep < executionTrace.length) {
        currentTraceStep = newStep;
        renderFrame(executionTrace[currentTraceStep]);
    }
}

function animateLoop() {
    animationFrameId = setTimeout(() => {
        if (currentTraceStep >= executionTrace.length) {
            pauseAnimation();
            return;
        }
        
        renderFrame(executionTrace[currentTraceStep]);
        currentTraceStep++;

        animateLoop();
    }, 1000 - animationSpeed); 
}

function getProcessColor(pid) {
    let sum = 0;
    for (let i = 0; i < pid.length; i++) {
        sum += pid.charCodeAt(i);
    }
    const colors = ['#4CAF50', '#2196F3', '#FFC107', '#E91E63', '#9C27B0', '#00BCD4', '#8BC34A'];
    return colors[sum % colors.length];
}

function renderFrame(state) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const maxTime = executionTrace.length > 0 ? executionTrace.length - 1 : 0; 

    renderGanttChart(state.time);
    renderTimeScale(maxTime);
    updateStatsPanel(state);
    updateProcessStates(state);

    document.getElementById('step-backward-btn').disabled = state.time === 0;
    document.getElementById('step-forward-btn').disabled = state.time === maxTime;
}

function renderGanttChart(currentTime) {
    const barHeight = 60;
    const yStart = 40;
    const maxTime = executionTrace.length > 0 ? executionTrace.length - 1 : 10;
    const timeUnitWidth = canvas.width / maxTime;

    calculatedProcesses.forEach(p => {
        const actualStart = p.start;
        const actualFinish = Math.min(p.finish, currentTime);

        if (actualFinish > actualStart) {
            const xStart = actualStart * timeUnitWidth;
            const width = (actualFinish - actualStart) * timeUnitWidth;

            ctx.fillStyle = getProcessColor(p.id);
            ctx.fillRect(xStart, yStart, width, barHeight);

            ctx.fillStyle = '#FFFFFF';
            ctx.font = '14px Arial';
            ctx.fillText(p.id, xStart + 5, yStart + barHeight / 2 + 5);
        }
    });

    ctx.fillStyle = 'red';
    const markerX = currentTime * timeUnitWidth;

    ctx.beginPath();
    ctx.moveTo(markerX, 20);
    ctx.lineTo(markerX - 5, 10);
    ctx.lineTo(markerX + 5, 10);
    ctx.closePath();
    ctx.fill();

    ctx.fillText(`t=${currentTime}`, markerX - 15, 35);
}

function renderTimeScale(maxTime) {
    const yAxis = 110;
    const timeUnitWidth = canvas.width / maxTime;

    ctx.strokeStyle = '#333';
    ctx.beginPath();
    ctx.moveTo(0, yAxis);
    ctx.lineTo(canvas.width, yAxis);
    ctx.stroke();

    ctx.fillStyle = '#333';
    ctx.font = '12px Arial';

    if (maxTime > 0) {
        for (let t = 0; t <= maxTime; t++) {
            const x = t * timeUnitWidth;
            ctx.beginPath();
            ctx.moveTo(x, yAxis);
            ctx.lineTo(x, yAxis + 5);
            ctx.stroke();
            ctx.fillText(t, x - 5, yAxis + 20);
        }
    }
}

function updateProcessStates(state) {
    const readyQueueDiv = document.getElementById('ready-queue-display');
    const statsDiv = document.getElementById('statistics');

    readyQueueDiv.innerHTML = state.readyQueue.map(pid => 
        `<span style="background-color: #FFC107; color: #333; padding: 4px 8px; margin-right: 5px; border-radius: 3px; font-weight: bold;">${pid}</span>`
    ).join('');

    if (state.runningProcess) {
        statsDiv.querySelector('h3').textContent = `Running: ${state.runningProcess}`;
        statsDiv.style.borderLeftColor = '#4CAF50';
    } else if (state.time === executionTrace.length - 1 && state.completedProcesses.length === calculatedProcesses.length) {
        statsDiv.querySelector('h3').textContent = 'Simulation Complete';
        statsDiv.style.borderLeftColor = '#333';
    } else {
        statsDiv.querySelector('h3').textContent = 'CPU Idle / Transition';
        statsDiv.style.borderLeftColor = '#ccc';
    }
}

function updateStatsPanel(state) {
    let totalWaitingTime = 0;
    let totalTurnaroundTime = 0;
    let completedCount = 0;

    calculatedProcesses.forEach(p => {
        if (p.finish <= state.time) {
            totalWaitingTime += p.waiting;
            totalTurnaroundTime += p.turnaround;
            completedCount++;
        }
    });

    const avgWaiting = completedCount > 0 ? (totalWaitingTime / completedCount).toFixed(2) : 'N/A';
    const avgTurnaround = completedCount > 0 ? (totalTurnaroundTime / completedCount).toFixed(2) : 'N/A';

    document.getElementById('current-time').textContent = state.time;
    document.getElementById('avg-waiting-time').textContent = avgWaiting;
    document.getElementById('avg-turnaround-time').textContent = avgTurnaround;
}

function exportScreenshot() {
    const dataURL = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = 'fcfs_trace_t' + currentTraceStep + '.png';
    link.href = dataURL;
    link.click();
}

function addProcessRow() {
    const tableBody = document.getElementById('process-table').getElementsByTagName('tbody')[0];
    const newRow = tableBody.insertRow();
    const pid = `P${processCounter++}`;

    newRow.insertCell(0).textContent = pid;
    newRow.insertCell(1).innerHTML = `<input type="number" value="0" min="0" data-id="${pid}" data-field="arrival">`;
    newRow.insertCell(2).innerHTML = `<input type="number" value="1" min="1" data-id="${pid}" data-field="burst">`;

    newRow.insertCell(3).innerHTML = `<button onclick="deleteProcess(this)">Delete</button>`; 
}

function deleteProcess(btn) {
    const row = btn.parentNode.parentNode;
    row.parentNode.removeChild(row);

    relabelProcesses();
}

function relabelProcesses() {
    const tableBody = document.getElementById('process-table').getElementsByTagName('tbody')[0];
    const rows = tableBody.rows;
    let counter = 1;
    for (const row of rows) {
        row.cells[0].textContent = `P${counter++}`;
    }
    processCounter = counter;
}

function getProcessesFromUI() {
    const processes = [];
    const tableBody = document.getElementById('process-table').getElementsByTagName('tbody')[0];
    const rows = tableBody.rows;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
        const arrivalInput = row.cells[1].getElementsByTagName('input')[0].value;
        const burstInput = row.cells[2].getElementsByTagName('input')[0].value;

        const arrivalTime = parseInt(arrivalInput);
        const burstTime = parseInt(burstInput);

        if (!isNaN(arrivalTime) && !isNaN(burstTime) && burstTime > 0) {
            processes.push({
                id: row.cells[0].textContent,
                arrival: arrivalTime,
                burst: burstTime,
                start: -1,
                finish: -1,
                turnaround: 0,
                waiting: 0,
            });
        }
    }
    return processes;
}

function calculateFCFS(rawProcesses) {
    const sortedProcesses = [...rawProcesses].sort((a, b) => a.arrival - b.arrival);

    let currentTime = 0;

    for (const process of sortedProcesses) {
        process.start = Math.max(currentTime, process.arrival);

        process.finish = process.start + process.burst;

        currentTime = process.finish;

        process.turnaround = process.finish - process.arrival;
        process.waiting = process.turnaround - process.burst;
    }

    calculatedProcesses = sortedProcesses;
    return sortedProcesses;
}

function generateExecutionTrace(processes) {
    executionTrace = [];
    if (processes.length === 0) return;

    const maxTime = Math.max(...processes.map(p => p.finish));

    for (let t = 0; t <= maxTime; t++) {
        let state = {
            time: t,
            runningProcess: null,
            readyQueue: [], 
            completedProcesses: []
        };

        processes.forEach(p => {
            if (p.finish <= t) {
            } else if (p.start <= t && p.finish > t) {
                state.runningProcess = p.id;
            } else if (p.arrival <= t && p.start > t) {
                state.readyQueue.push(p.id);
            }
        });

        executionTrace.push(state);
    }

    initAnimation(executionTrace, calculatedProcesses); 
}

function runSimulation() {
    const rawProcesses = getProcessesFromUI();
    
    if (rawProcesses.length === 0) {
        alert("Please add at least one valid process (Burst Time > 0) to run the simulation.");
        return;
    }
    
    const calculatedProcessesResult = calculateFCFS(rawProcesses);
    
    generateExecutionTrace(calculatedProcessesResult);
}
