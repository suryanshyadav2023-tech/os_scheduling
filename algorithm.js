// Get process data from the table
function getProcessesFromUI() {
    const tableBody = document.querySelector('#process-table tbody');
    const rows = tableBody.querySelectorAll('tr');
    const processes = [];

    rows.forEach(row => {
        const id = row.cells[0].textContent.trim();
        const arrival = parseInt(row.querySelector('input[data-field="arrival"]').value);
        const burst = parseInt(row.querySelector('input[data-field="burst"]').value);

        if (!isNaN(arrival) && !isNaN(burst) && burst > 0) {
            processes.push({
                id,
                arrival,
                burst,
                start: -1,
                finish: -1,
                waiting: 0,
                turnaround: 0
            });
        }
    });

    return processes;
}

// FCFS Scheduling Algorithm
function calculateFCFS(processes) {
    const sorted = [...processes].sort((a, b) => a.arrival - b.arrival);
    let currentTime = 0;

    sorted.forEach(proc => {
        proc.start = Math.max(currentTime, proc.arrival);
        proc.finish = proc.start + proc.burst;
        proc.turnaround = proc.finish - proc.arrival;
        proc.waiting = proc.start - proc.arrival;
        currentTime = proc.finish;
    });

    return sorted;
}

// Generate execution trace for animation
function generateExecutionTrace(processes) {
    const trace = [];
    const maxTime = Math.max(...processes.map(p => p.finish));

    for (let t = 0; t <= maxTime; t++) {
        const readyQueue = [];
        let running = null;
        const completed = [];

        processes.forEach(p => {
            if (p.finish <= t) {
                completed.push(p.id);
            } else if (p.start <= t && p.finish > t) {
                running = p.id;
            } else if (p.arrival <= t && p.start > t) {
                readyQueue.push(p.id);
            }
        });

        trace.push({
            time: t,
            runningProcess: running,
            readyQueue,
            completedProcesses: completed
        });
    }

    return trace;
}

// ==========================
// Simulation Control Section
// ==========================

// Run Simulation
function runSimulation() {
    const processes = getProcessesFromUI();

    if (processes.length === 0) {
        alert("⚠️ Please add at least one valid process before running the simulation.");
        return;
    }

    const scheduled = calculateFCFS(processes);
    const trace = generateExecutionTrace(scheduled);

    // Call animation.js to visualize
    if (typeof initAnimation === "function") {
        initAnimation(trace, scheduled);
    } else {
        console.error("❌ initAnimation() not found. Check animation.js import.");
    }
}

// Reset the simulation (table + canvas)
function resetSimulation() {
    const tbody = document.querySelector('#process-table tbody');
    if (tbody) tbody.innerHTML = '';

    const canvas = document.getElementById('scheduler-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    const readyQueueDiv = document.getElementById('ready-queue-display');
    if (readyQueueDiv) readyQueueDiv.textContent = '';

    if (typeof resetAnimation === "function") {
        resetAnimation(); // optional cleanup if animation.js supports it
    }
}

// ==========================
// Table Row Management
// ==========================

// Add new process row dynamically
function addProcessRow() {
    const tbody = document.querySelector('#process-table tbody');
    const rowCount = tbody.rows.length;
    const pid = `P${rowCount + 1}`;
    const newRow = tbody.insertRow();

    newRow.insertCell(0).textContent = pid;
    newRow.insertCell(1).innerHTML = `<input type="number" value="0" min="0" data-id="${pid}" data-field="arrival">`;
    newRow.insertCell(2).innerHTML = `<input type="number" value="1" min="1" data-id="${pid}" data-field="burst">`;
    newRow.insertCell(3).innerHTML = `<button onclick="deleteProcess(this)">Delete</button>`;
}

// Delete a process from table
function deleteProcess(btn) {
    const row = btn.closest('tr');
    if (row) row.remove();
    relabelProcesses();
}

// Reassign process IDs after deletion
function relabelProcesses() {
    const rows = document.querySelectorAll('#process-table tbody tr');
    rows.forEach((row, index) => {
        row.cells[0].textContent = `P${index + 1}`;
    });
}

// ==========================
// Event Listener Initialization
// ==========================
document.addEventListener("DOMContentLoaded", () => {
    const addBtn = document.getElementById("add-process-btn");
    const simulateBtn = document.getElementById("simulate-btn");
    const resetBtn = document.getElementById("reset-btn");

    if (addBtn) addBtn.addEventListener("click", addProcessRow);
    if (simulateBtn) simulateBtn.addEventListener("click", runSimulation);
    if (resetBtn) resetBtn.addEventListener("click", resetSimulation);
});
