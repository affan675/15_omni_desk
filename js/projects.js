document.addEventListener('omniReady', () => {
    renderProjects();
});

function renderProjects() {
    const projects = loadData('omni_projects');
    const tasks = loadData('omni_tasks');
    const list = document.getElementById('projects-list');
    const gantt = document.getElementById('gantt-chart');
    
    list.innerHTML = '';
    
    const thisYear = new Date().getFullYear();
    const yearStartMs = new Date(`${thisYear}-01-01`).getTime();
    const yearEndMs = new Date(`${thisYear}-12-31`).getTime();
    const yearDurationMs = yearEndMs - yearStartMs;

    // Build Gantt Chart HTML
    let ganttHtml = '';
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Render Month Headers
    ganttHtml += '<div class="gantt-months">';
    monthNames.forEach(m => ganttHtml += `<div class="gantt-month">${m}</div>`);
    ganttHtml += '</div><div class="gantt-bars-container">';

    projects.forEach(p => {
        // Render Card
        const pTasks = tasks.filter(t => t.projectId === p.id);
        const doneTasks = pTasks.filter(t => t.status === 'done').length;
        const totalTime = pTasks.reduce((sum, t) => sum + t.actualMinutes, 0);
        
        list.innerHTML += `
            <div class="card">
                <h3>${p.name}</h3>
                <p>Status: ${p.status}</p>
                <p>Budget: ₹${p.budget}</p>
                <p>Deadline: ${p.end}</p>
                <div class="progress-bg mt-1 mb-1"><div class="progress-bar" style="width: ${pTasks.length ? (doneTasks/pTasks.length)*100 : 0}%"></div></div>
                <p><small>${doneTasks}/${pTasks.length} tasks done | ${(totalTime/60).toFixed(1)} hrs spent</small></p>
                <div class="mt-1">
                    <button class="btn" onclick="editProject('${p.id}')"><i class="fas fa-edit"></i></button>
                    <button class="btn" onclick="deleteProject('${p.id}')"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;

        // Render Gantt Bar
        const sMs = new Date(p.start).getTime();
        const eMs = new Date(p.end).getTime();
        
        let leftPct = ((sMs - yearStartMs) / yearDurationMs) * 100;
        let widthPct = ((eMs - sMs) / yearDurationMs) * 100;
        
        // Clamp for visuals
        leftPct = Math.max(0, leftPct);
        widthPct = Math.min(100 - leftPct, widthPct);
        if (widthPct < 2 && widthPct > 0) widthPct = 2; // minimum width for visibility
        if (widthPct < 0) widthPct = 0; // ensure no negative width

        const projectProgress = pTasks.length ? (doneTasks / pTasks.length) * 100 : 0;

        ganttHtml += `
            <div class="gantt-project-row">
                <div class="gantt-bar" style="left: ${leftPct}%; width: ${widthPct}%;" 
                     title="${p.name} (${p.start} to ${p.end}) - ${projectProgress.toFixed(0)}% complete">
                    <span class="gantt-bar-name">${p.name}</span>
                    <div class="gantt-progress-bg">
                        <div class="gantt-progress-bar" style="width: ${projectProgress}%"></div>
                    </div>
                </div>
            </div>
        `;
    });
    ganttHtml += '</div>'; // Close gantt-bars-container
    gantt.innerHTML = ganttHtml; // Assign all at once
}

function openProjModal() {
    document.getElementById('p-id').value = '';
    document.getElementById('p-name').value = '';
    document.getElementById('p-budget').value = '';
    document.getElementById('p-start').value = new Date().toISOString().split('T')[0];
    document.getElementById('p-end').value = '';
    document.getElementById('p-status').value = 'active';
    document.getElementById('proj-modal').classList.remove('hidden');
}

function saveProject() {
    const projects = loadData('omni_projects');
    const id = document.getElementById('p-id').value || generateId();
    const p = {
        id: id,
        name: document.getElementById('p-name').value,
        budget: document.getElementById('p-budget').value,
        start: document.getElementById('p-start').value,
        end: document.getElementById('p-end').value,
        status: document.getElementById('p-status').value
    };
    
    const existing = projects.findIndex(x => x.id === id);
    if(existing >= 0) projects[existing] = p; else projects.push(p);
    
    saveData('omni_projects', projects);
    closeModal('proj-modal');
    renderProjects();
}

function editProject(id) {
    const p = loadData('omni_projects').find(x => x.id === id);
    if(!p) return;
    document.getElementById('p-id').value = p.id;
    document.getElementById('p-name').value = p.name;
    document.getElementById('p-budget').value = p.budget;
    document.getElementById('p-start').value = p.start;
    document.getElementById('p-end').value = p.end;
    document.getElementById('p-status').value = p.status;
    document.getElementById('proj-modal').classList.remove('hidden');
}

function deleteProject(id) {
    if(!confirm('Delete?')) return;
    saveData('omni_projects', loadData('omni_projects').filter(p => p.id !== id));
    renderProjects();
}