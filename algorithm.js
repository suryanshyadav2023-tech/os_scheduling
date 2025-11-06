// algorithm.js — FCFS Scheduling Logic + Trace Generation

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
        // Process starts after arrival or when CPU becomes free
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

// Run Simulation
function runSimulation() {
    const processes = getProcessesFromUI();

    if (processes.length === 0) {
        alert("Please add at least one valid process before running the simulation.");
        return;
    }

    const scheduled = calculateFCFS(processes);
    const trace = generateExecutionTrace(scheduled);

    // Send data to animation.js
    initAnimation(trace, scheduled);
}

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
    row.remove();

    relabelProcesses();
}

// Reassign process IDs after deletion
function relabelProcesses() {
    const rows = document.querySelectorAll('#process-table tbody tr');
    rows.forEach((row, index) => {
        row.cells[0].textContent = `P${index + 1}`;
    });
}
