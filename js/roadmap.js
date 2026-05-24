document.addEventListener('omniReady', () => {
    renderRoadmap();
});

function renderRoadmap() {
    const roadmap = loadData('omni_roadmap');
    const grid = document.getElementById('roadmap-grid');
    grid.innerHTML = '';

    roadmap.forEach(v => {
        const msHtml = v.milestones.map(m => `
            <div class="flex-row mt-05">
                <input type="checkbox" ${m.done ? 'checked' : ''} onchange="toggleMilestone('${v.id}', '${m.id}', this.checked)">
                <span style="${m.done ? 'text-decoration:line-through; opacity:0.6;' : ''}">${m.text}</span>
            </div>
        `).join('');

        grid.innerHTML += `
            <div class="card">
                <h3>${v.name}</h3>
                <div class="mt-1">${msHtml}</div>
                <div class="flex-row mt-1">
                    <input type="text" id="ms-input-${v.id}" class="input-full" placeholder="New milestone...">
                    <button class="btn btn-primary" onclick="addMilestone('${v.id}')"><i class="fas fa-plus"></i></button>
                </div>
            </div>
        `;
    });
}

function toggleMilestone(vId, mId, state) {
    const roadmap = loadData('omni_roadmap');
    const v = roadmap.find(x => x.id === vId);
    if(v) {
        const m = v.milestones.find(x => x.id === mId);
        if(m) m.done = state;
        saveData('omni_roadmap', roadmap);
        renderRoadmap();
    }
}

function addMilestone(vId) {
    const input = document.getElementById(`ms-input-${vId}`);
    if(!input.value.trim()) return;
    
    const roadmap = loadData('omni_roadmap');
    const v = roadmap.find(x => x.id === vId);
    if(v) {
        v.milestones.push({ id: generateId(), text: input.value, done: false });
        saveData('omni_roadmap', roadmap);
        renderRoadmap();
    }
}