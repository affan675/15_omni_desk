let activeTimer = { taskId: null, startMs: null };

document.addEventListener('omniReady', () => {
    const settings = loadData('omni_settings');
    switchView(settings.defaultTaskView || 'kanban');
    renderTasks();
    initSortable();

    // Populate project dropdown
    const projs = loadData('omni_projects');
    const projSelect = document.getElementById('t-project');
    if(projSelect) {
        projSelect.innerHTML = '<option value="">No Project</option>' + 
            projs.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
    }
});

const viewTemplates = {
    kanban: `
        <div id="view-kanban" class="task-view">
            <div class="kanban-board">
                <div class="kanban-col" data-status="todo"><h3>To Do</h3><div class="k-list" id="k-todo"></div></div>
                <div class="kanban-col" data-status="in-progress"><h3>In Progress</h3><div class="k-list" id="k-in-progress"></div></div>
                <div class="kanban-col" data-status="review"><h3>Review</h3><div class="k-list" id="k-review"></div></div>
                <div class="kanban-col" data-status="done"><h3>Done</h3><div class="k-list" id="k-done"></div></div>
            </div>
        </div>
    `,
    list: `
        <div id="view-list" class="task-view card">
            <table class="data-table">
                <thead><tr><th>Title</th><th>Project</th><th>Priority</th><th>Due</th><th>Status</th><th>Time (m)</th><th>Actions</th></tr></thead>
                <tbody id="list-tbody"></tbody>
            </table>
        </div>
    `,
    calendar: `
        <div id="view-calendar" class="task-view card">
            <div id="cal-header" class="flex-between mb-1"></div>
            <div class="calendar-grid" id="cal-grid"></div>
        </div>
    `
};

function switchView(view) {
    const container = document.getElementById('view-container');
    if(!container) return;

    // Update Active Tab UI
    document.querySelectorAll('.btn-tab').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-view') === view);
    });

    // Inject only the active view's HTML
    container.innerHTML = viewTemplates[view];

    // Re-initialize view data
    if(view === 'calendar') {
        renderCalendar();
    } else {
        renderTasks();
        if(view === 'kanban') initSortable();
    }
}

function renderTasks() {
    const tasks = loadData('omni_tasks');
    
    // Clear Kanban
    ['todo', 'in-progress', 'review', 'done'].forEach(s => {
        const el = document.getElementById(`k-${s}`);
        if(el) el.innerHTML = '';
    });
    
    // Clear List
    const listBody = document.getElementById('list-tbody');
    if(listBody) listBody.innerHTML = '';

    tasks.forEach(t => {
        // Kanban
        const kCol = document.getElementById(`k-${t.status}`);
        if(kCol) {
            const timerBtn = activeTimer.taskId === t.id 
                ? `<button class="btn" style="color:red" onclick="stopTimer('${t.id}')"><i class="fas fa-stop"></i></button>`
                : `<button class="btn" onclick="startTimer('${t.id}')"><i class="fas fa-play"></i></button>`;
            const completeBtn = t.status !== 'done' ? `<button class="btn complete-task" title="Mark Done" onclick="markDone('${t.id}')"><i class="fas fa-check"></i></button>` : '';
            
            kCol.innerHTML += `
                <div class="kanban-card" data-id="${t.id}">
                    <div class="k-title">${t.title}</div>
                    <div class="k-meta">Due: ${t.dueDate} | P: ${t.priority}</div>
                    <div class="k-actions">
                        ${timerBtn}
                        ${completeBtn}
                        <button class="btn" onclick="editTask('${t.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn" onclick="deleteTask('${t.id}')"><i class="fas fa-trash"></i></button>
                    </div>
                </div>
            `;
        }

        // List
        const listBodyInner = document.getElementById('list-tbody');
        if(listBodyInner) {
            const completeBtn = t.status !== 'done' ? `<button class="btn complete-task" title="Mark Done" onclick="markDone('${t.id}')"><i class="fas fa-check"></i></button>` : '';
            listBodyInner.innerHTML += `
                <tr>
                    <td>${t.title}</td>
                    <td>${t.projectId || '-'}</td>
                    <td>${t.priority}</td>
                    <td>${t.dueDate}</td>
                    <td>${t.status}</td>
                    <td>${t.actualMinutes}</td>
                    <td>
                        ${completeBtn}
                        <button class="btn" onclick="editTask('${t.id}')"><i class="fas fa-edit"></i></button>
                        <button class="btn" onclick="deleteTask('${t.id}')"><i class="fas fa-trash"></i></button>
                    </td>
                </tr>
            `;
        }
    });
}

function initSortable() {
    if(typeof Sortable === 'undefined') return;
    document.querySelectorAll('.k-list').forEach(col => {
        new Sortable(col, {
            group: 'shared',
            animation: 150,
            onEnd: function (evt) {
                const taskId = evt.item.getAttribute('data-id');
                const newStatus = evt.to.parentElement.getAttribute('data-status');
                const tasks = loadData('omni_tasks');
                const task = tasks.find(t => t.id === taskId);
                if(task && task.status !== newStatus) {
                    task.status = newStatus;
                    saveData('omni_tasks', tasks);
                    renderTasks();
                }
            }
        });
    });
}

function renderCalendar() {
    const grid = document.getElementById('cal-grid');
    const header = document.getElementById('cal-header');
    grid.innerHTML = '';
    
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    
    header.innerHTML = `<h3>${today.toLocaleString('default', { month: 'long' })} ${year}</h3>`;
    
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    const tasks = loadData('omni_tasks');
    
    // blanks
    for(let i=0; i<firstDay; i++) {
        grid.innerHTML += `<div class="cal-day" style="opacity:0.3"></div>`;
    }
    
    for(let d=1; d<=daysInMonth; d++) {
        const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
        const dayTasks = tasks.filter(t => t.dueDate === dateStr);
        const taskHtml = dayTasks.map(t => `<div class="cal-task" onclick="editTask('${t.id}')">${t.title}</div>`).join('');
        
        grid.innerHTML += `
            <div class="cal-day">
                <div class="cal-date">${d}</div>
                ${taskHtml}
            </div>
        `;
    }
}

function openTaskModal() {
    document.getElementById('t-id').value = '';
    document.getElementById('t-title').value = '';
    document.getElementById('t-due').value = new Date().toISOString().split('T')[0];
    document.getElementById('task-modal').classList.remove('hidden');
}

function saveTask() {
    const tasks = loadData('omni_tasks');
    const id = document.getElementById('t-id').value || generateId();
    const task = {
        id: id,
        title: document.getElementById('t-title').value,
        projectId: document.getElementById('t-project').value,
        priority: document.getElementById('t-priority').value,
        dueDate: document.getElementById('t-due').value,
        status: document.getElementById('t-status').value,
        actualMinutes: 0, timeLogs: []
    };
    
    const existingIdx = tasks.findIndex(t => t.id === id);
    if(existingIdx >= 0) {
        task.actualMinutes = tasks[existingIdx].actualMinutes;
        task.timeLogs = tasks[existingIdx].timeLogs;
        tasks[existingIdx] = task;
    } else {
        tasks.push(task);
    }
    
    saveData('omni_tasks', tasks);
    closeModal('task-modal');
    renderTasks();
}

function editTask(id) {
    const task = loadData('omni_tasks').find(t => t.id === id);
    if(!task) return;
    document.getElementById('t-id').value = task.id;
    document.getElementById('t-title').value = task.title;
    document.getElementById('t-project').value = task.projectId;
    document.getElementById('t-priority').value = task.priority;
    document.getElementById('t-due').value = task.dueDate;
    document.getElementById('t-status').value = task.status;
    document.getElementById('task-modal').classList.remove('hidden');
}

function deleteTask(id) {
    if(!confirm('Delete task?')) return;
    const tasks = loadData('omni_tasks').filter(t => t.id !== id);
    saveData('omni_tasks', tasks);
    renderTasks();
}

function markDone(id) {
    const tasks = loadData('omni_tasks');
    const t = tasks.find(x => x.id === id);
    if(t) { t.status = 'done'; saveData('omni_tasks', tasks); renderTasks(); }
}

function startTimer(id) {
    activeTimer = { taskId: id, startMs: Date.now() };
    renderTasks();
}

function stopTimer(id) {
    if(activeTimer.taskId !== id) return;
    const durationMins = Math.round((Date.now() - activeTimer.startMs) / 60000);
    if(durationMins > 0) {
        const tasks = loadData('omni_tasks');
        const t = tasks.find(x => x.id === id);
        if(t) {
            const today = new Date().toISOString();
            t.timeLogs.push({ start: today, duration: durationMins });
            t.actualMinutes += durationMins;
            saveData('omni_tasks', tasks);
        }
    }
    activeTimer = { taskId: null, startMs: null };
    renderTasks();
}