
let calculatedProcesses = [];

let executionTrace = [];




function getProcessesFromUI() {
    const processes = [];
    const tableBody = document.getElementById('process-table').getElementsByTagName('tbody')[0];
    const rows = tableBody.rows;

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        
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

// --- Animation Data Generation ---


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
                
                state.completedProcesses.push(p.id);
            } else if (p.start <= t && p.finish > t) {
                
                state.runningProcess = p.id;
            } else if (p.arrival <= t && p.start > t) {
                
                state.readyQueue.push(p.id);
            }
        });
        
        executionTrace.push(state);
    }
    
    
    document.getElementById('play-btn').disabled = false;
    document.getElementById('step-forward-btn').disabled = false;

    
    initAnimation(executionTrace); 
}