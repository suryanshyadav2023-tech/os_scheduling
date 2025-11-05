let calculatedProcesses = [];
let executionTrace = [];


function getProcessesFromUI() {
    const processes = [];
    const tableBody = document.getElementById('process-table').getElementsByTagName('tbody')[0];
    const rows = tableBody.rows;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];

        // CRITICAL: Ensure inputs are read from the right cells based on your HTML structure
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

function calculateFCFS(rawProcesses) {
    // Sort processes primarily by arrival time
    const sortedProcesses = [...rawProcesses].sort((a, b) => a.arrival - b.arrival);

    let currentTime = 0;

    for (const process of sortedProcesses) {
        // CPU starts processing the job either when it arrives or when the CPU is free (whichever is later)
        process.start = Math.max(currentTime, process.arrival);

        // Process finishes when it starts plus its burst time
        process.finish = process.start + process.burst;

        // Update the current time for the next process
        currentTime = process.finish;

        // Calculate metrics
        process.turnaround = process.finish - process.arrival;
        process.waiting = process.turnaround - process.burst;
    }

    // Save the final calculated stats globally for the rendering code
    calculatedProcesses = sortedProcesses;
    return sortedProcesses;
}

// --- Animation Data Generation ---

function generateExecutionTrace(processes) {
    executionTrace = [];
    if (processes.length === 0) return;

    // Get the final time for the Gantt chart scale
    const maxTime = Math.max(...processes.map(p => p.finish));

    for (let t = 0; t <= maxTime; t++) {
        let state = {
            time: t,
            runningProcess: null,
            readyQueue: [], 
            completedProcesses: []
        };

        processes.forEach(p => {
            // Check process state at time 't'
            if (p.finish <= t) {
                // Completed
                state.completedProcesses.push(p.id);
            } else if (p.start <= t && p.finish > t) {
                // Running
                state.runningProcess = p.id;
            } else if (p.arrival <= t && p.start > t) {
                // Ready (arrived but hasn't started yet)
                state.readyQueue.push(p.id);
            }
        });

        executionTrace.push(state);
    }

    // CRITICAL FIX: The initAnimation function expects two global arrays 
    // to be passed or set. It also needs the calculated process stats.
    // Call the fixed animation initialization function with the trace AND the calculated processes.
    initAnimation(executionTrace, calculatedProcesses); 
}


// --- CRITICAL MISSING FUNCTION: The Entry Point ---

/**
 * The main function called when the user clicks 'Run Simulation'.
 * It orchestrates data reading, calculation, and visualization setup.
 */
function startSimulation() {
    // 1. Reset any ongoing animation
    pauseAnimation();
    
    // 2. Read raw data from the UI table
    const rawProcesses = getProcessesFromUI();
    
    // 3. Perform FCFS scheduling calculation
    const calculatedProcessesResult = calculateFCFS(rawProcesses);
    
    // 4. Generate the frame-by-frame animation timeline
    generateExecutionTrace(calculatedProcessesResult);

    // After this, initAnimation is called inside generateExecutionTrace, 
    // which enables the 'Play' button and starts the visualizer.
}
