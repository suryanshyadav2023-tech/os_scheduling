// --- Global Data ---
let calculatedProcesses = [];
let executionTrace = [];

// --- Get Input ---
function getProcessesFromUI() {
    const processes = [];
    const rows = document.querySelector('#process-table tbody').rows;
    for (let row of rows) {
        const arrival = parseInt(row.cells[1].querySelector('input').value);
        const burst = parseInt(row.cells[2].querySelector('input').value);
        if (!isNaN(arrival) && !isNaN(burst) && burst > 0) {
            processes.push({
                id: row.cells[0].textContent,
                arrival,
                burst,
                start: -1,
                finish: -1,
                turnaround: 0,
                waiting: 0,
            });
        }
    }
    return processes;
}

// --- FCFS Algorithm ---
function calculateFCFS(rawProcesses) {
    const sorted = [...rawProcesses].sort((a, b) => a.arrival - b.arrival);
    let currentTime = 0;

    for (const p of sorted) {
        p.start = Math.max(currentTime, p.arrival);
        p.finish = p.start + p.burst;
        currentTime = p.finish;
        p.turnaround = p.finish - p.arrival;
        p.waiting = p.turnaround - p.burst;
    }

    calculatedProcesses = sorted;
    return sorted;
}

// --- Execution Trace (Fixed for Ready Queue) ---
function generateExecutionTrace(processes) {
    executionTrace = [];
    if (processes.length === 0) return;
    const maxTime = Math.max(...processes.map(p => p.finish));

    for (let t = 0; t <= maxTime; t++) {
        let state = { time: t, runningProcess: null, readyQueue: [], completedProcesses: [] };

        const running = processes.find(p => t >= p.start && t < p.finish);
        if (running) state.runningProcess = running.id;

        state.completedProcesses = processes.filter(p => t >= p.finish).map(p => p.id);
        state.readyQueue = processes.filter(p => p.arrival <= t && t < p.start).map(p => p.id);

        executionTrace.push(state);
    }

    document.getElementById('play-btn').disabled = false;
    document.getElementById('step-forward-btn').disabled = false;

    initAnimation(executionTrace);
}
