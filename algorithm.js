// --- Global Data Structures ---
// This array will hold the calculated process objects (with start, finish, waiting times)
let calculatedProcesses = [];
// This array will hold the frame-by-frame timeline needed for the animator
let executionTrace = [];

// --- UI Interaction (Must match the structure in index.html) ---

/**
 * Reads process data (ID, AT, BT) from the HTML table.
 * @returns {Array} Array of raw process objects.
 */
function getProcessesFromUI() {
    const processes = [];
    const tableBody = document.getElementById('process-table').getElementsByTagName('tbody')[0];
    const rows = tableBody.rows;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        // Ensure you grab the value from the input fields
        const arrivalTime = parseInt(row.cells[1].getElementsByTagName('input')[0].value);
        const burstTime = parseInt(row.cells[2].getElementsByTagName('input')[0].value);

        if (!isNaN(arrivalTime) && !isNaN(burstTime) && burstTime > 0) {
            processes.push({
                id: row.cells[0].textContent, // P1, P2, etc.
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

// --- FCFS Algorithm Core ---

/**
 * Executes the FCFS algorithm to calculate all timing metrics.
 * @param {Array} rawProcesses - Array of process objects with AT and BT.
 * @returns {Array} Array of process objects with all metrics calculated.
 */
function calculateFCFS(rawProcesses) {
    // 1. Sort by Arrival Time (FCFS primary rule)
    const sortedProcesses = [...rawProcesses].sort((a, b) => a.arrival - b.arrival);

    let currentTime = 0;

    for (const process of sortedProcesses) {
        // Start Time: Max of (current CPU time) or (process arrival time)
        process.start = Math.max(currentTime, process.arrival);

        // Finish Time (Completion Time)
        process.finish = process.start + process.burst;

        // Update the CPU's current time for the next process
        currentTime = process.finish;

        // Calculate metrics
        process.turnaround = process.finish - process.arrival;
        process.waiting = process.turnaround - process.burst;
    }

    // Store the results globally for animation and stats
    calculatedProcesses = sortedProcesses;
    return sortedProcesses;
}

// --- Animation Data Generation ---

/**
 * Creates a detailed timeline (trace) of execution for the animator.
 * @param {Array} processes - Processes with calculated start/finish times.
 */
function generateExecutionTrace(processes) {
    executionTrace = [];
    if (processes.length === 0) return;

    // Determine the total simulation time
    const maxTime = Math.max(...processes.map(p => p.finish));
    
    // Create a state object for every time unit (t=0, t=1, t=2, ...)
    for (let t = 0; t <= maxTime; t++) {
        let state = {
            time: t,
            runningProcess: null,
            readyQueue: [], // Use this for the Ready Queue Display
            completedProcesses: []
        };

        // Determine the state of all processes at time 't'
        processes.forEach(p => {
            if (p.finish <= t) {
                // Process is completed
                state.completedProcesses.push(p.id);
            } else if (p.start <= t && p.finish > t) {
                // Process is currently running
                state.runningProcess = p.id;
            } else if (p.arrival <= t && p.start > t) {
                // Process has arrived but hasn't started yet (in the ready queue)
                state.readyQueue.push(p.id);
            }
        });
        
        executionTrace.push(state);
    }
    
    // IMPORTANT: Enable the animation controls now that the trace is ready
    document.getElementById('play-btn').disabled = false;
    document.getElementById('step-forward-btn').disabled = false;

    // Call the animator initialization function (defined in animation.js, Phase 3)
    initAnimation(executionTrace); 
}