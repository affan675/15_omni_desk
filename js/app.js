// --- GLOBAL DATA MGT ---
function loadData(key) {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : getDefaults(key);
}

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function generateId() {
    return Math.random().toString(36).substr(2, 9);
}

function getDefaults(key) {
    const defaults = {
        omni_settings: { themeMode: 'dark', themePalette: 'a', cursorsEnabled: true, defaultTaskView: 'kanban' },
        omni_tasks: [
            { id: '1', title: 'Design Homepage', projectId: 'p1', priority: 'high', dueDate: new Date().toISOString().split('T')[0], status: 'in-progress', estimatedMinutes: 120, actualMinutes: 0, timeLogs: [] }
        ],
        omni_projects: [
            { id: 'p1', name: 'Jute Website', budget: 5000, start: '2024-01-01', end: '2024-12-31', status: 'active' }
        ],
        omni_income: [
            { id: 'i1', client: 'Alpha Corp', amount: 2500, date: new Date().toISOString().split('T')[0], desc: 'Advance payment' }
        ],
        omni_roadmap: [
            { id: 'v1', name: 'Jute Industry', milestones: [{id:'m1', text:'Market Research', done:true}, {id:'m2', text:'Find Suppliers', done:false}] },
            { id: 'v2', name: 'Eco Bricks', milestones: [{id:'m3', text:'Prototype phase', done:false}] },
            { id: 'v3', name: 'Fish Feed', milestones: [{id:'m4', text:'Formula testing', done:false}] },
            { id: 'v4', name: 'Afrasia Exports', milestones: [{id:'m5', text:'Licensing', done:false}] }
        ]
    };
    saveData(key, defaults[key]);
    return defaults[key];
}

// --- LAYOUT INJECTION ---
function renderLayout() {
    const appLayout = document.getElementById('app-layout');
    if(!appLayout) return;

    // Strict CSS injection to lock the layout and prevent height expansion
    const style = document.createElement('style');
    style.textContent = `
        html, body { height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; }
        #app-layout { 
            height: 100vh !important; width: 100vw !important; 
            position: fixed !important; top: 0; left: 0; 
            display: flex !important; flex-direction: column !important; overflow: hidden !important; 
        }
        #app-container { display: flex !important; flex: 1 !important; height: 100% !important; min-height: 0 !important; overflow: hidden !important; }
        .main-content { display: flex !important; flex-direction: column !important; flex: 1 !important; min-height: 0 !important; overflow: hidden !important; }
        #page-content { flex: 1 !important; overflow-y: auto !important; min-height: 0 !important; padding: 20px; box-sizing: border-box; }
        .dashboard-grid { display: grid !important; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)) !important; gap: 20px !important; align-items: stretch !important; }
        .card { height: 100% !important; display: flex !important; flex-direction: column !important; overflow: hidden !important; }
        #preloader { position: fixed !important; top: 0; left: 0; width: 100vw; height: 100vh; z-index: 9999; 
                     display: flex; flex-direction: column; align-items: center; justify-content: center; background: #111; transition: opacity 0.5s; }

        /* Projects Page Gantt Chart Styles */
        .gantt-container {
            position: relative;
            width: 100%;
            overflow-x: auto; /* Allow horizontal scrolling if timeline is wide */
            padding-bottom: 10px; /* Space for scrollbar */
            min-height: 200px; /* Ensure visibility even with few projects */
        }
        .gantt-months {
            display: flex;
            border-bottom: 1px solid var(--border);
            margin-bottom: 10px;
            position: sticky; /* Keep months visible when scrolling bars */
            top: 0;
            background: var(--background-color); /* Ensure background is not transparent */
            z-index: 10;
        }
        .gantt-month {
            flex: 1;
            text-align: center;
            padding: 5px 0;
            font-size: 0.8em;
            color: var(--text-color-light);
            min-width: 80px; /* Prevent months from getting too squished */
        }
        .gantt-bars-container {
            display: flex; /* Stack bars vertically */
            flex-direction: column;
            gap: 10px; /* Space between project rows */
            min-height: 150px;
            padding-top: 5px; /* Small padding at top */
        }
        .gantt-project-row { /* Wrapper for each project's bar */
            position: relative; /* For positioning the bar inside */
            height: 30px; /* Height of the row */
            width: 100%; /* Take full width of container */
        }
        .gantt-bar {
            position: absolute; /* Position within its row */
            height: 100%; /* Fill the row height */
            background-color: var(--primary);
            border-radius: 4px;
            display: flex;
            align-items: center;
            padding: 0 8px;
            color: white;
            font-size: 0.85em;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            transition: transform 0.2s ease-in-out;
            cursor: pointer;
            top: 0; /* Position at top of its row */
            left: 0; /* Position at left of its row */
        }
        .gantt-bar:hover {
            transform: scale(1.02);
            z-index: 1;
        }
        .gantt-bar-name {
            flex-grow: 1;
            margin-right: 5px;
        }
        .gantt-progress-bg {
            width: 50px; /* Fixed width for progress bar */
            height: 8px;
            background-color: rgba(255,255,255,0.3);
            border-radius: 4px;
            overflow: hidden;
        }
        .gantt-progress-bar {
            height: 100%;
            background-color: var(--secondary);
            border-radius: 4px;
        }
    `;
    document.head.appendChild(style);

    appLayout.innerHTML = `
        <div id="preloader">
            <i class="fas fa-cog gear-spinner"></i>
            <div class="loader-text">OmniDesk</div>
        </div>
        <div id="app-container">
            <nav id="sidebar" class="sidebar">
                <div class="sidebar-logo">OmniDesk</div>
                <a href="index.html" class="nav-link"><i class="fas fa-home"></i> Dashboard</a>
                <a href="tasks.html" class="nav-link"><i class="fas fa-tasks"></i> Tasks</a>
                <a href="projects.html" class="nav-link"><i class="fas fa-project-diagram"></i> Projects</a>
                <a href="income.html" class="nav-link"><i class="fas fa-wallet"></i> Income</a>
                <a href="roadmap.html" class="nav-link"><i class="fas fa-map-signs"></i> Roadmap</a>
                <a href="settings.html" class="nav-link"><i class="fas fa-cog"></i> Settings</a>
            </nav>
            <main class="main-content">
                <header class="topbar">
                    <button id="mobile-menu-btn" onclick="toggleSidebar()"><i class="fas fa-bars"></i></button>
                    <div style="flex:1"></div>
                    <button class="btn" onclick="togglePalette()"><i class="fas fa-palette"></i> Palette</button>
                    <button class="btn" onclick="toggleTheme()"><i class="fas fa-moon"></i></button>
                </header>
                <div id="page-content">
                    ${typeof getPageContent === 'function' ? getPageContent() : ''}
                </div>
            </main>
        </div>
    `;

    // Highlight active nav
    const currentFile = location.pathname.split('/').pop() || 'index.html';
    document.querySelectorAll('.nav-link').forEach(link => {
        if(link.getAttribute('href') === currentFile) link.classList.add('active');
    });
}

function toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
}

// --- THEME & CURSORS ---
function applyTheme() {
    const settings = loadData('omni_settings');
    document.body.className = `theme-${settings.themeMode} palette-${settings.themePalette}`;
    if(settings.cursorsEnabled) document.body.classList.add('cursors-enabled');
}

function toggleTheme() {
    const settings = loadData('omni_settings');
    settings.themeMode = settings.themeMode === 'dark' ? 'light' : 'dark';
    saveData('omni_settings', settings);
    applyTheme();
}

function togglePalette() {
    const settings = loadData('omni_settings');
    settings.themePalette = settings.themePalette === 'a' ? 'b' : 'a';
    saveData('omni_settings', settings);
    applyTheme();
}

// Modal generic helpers
function closeModal(id) { document.getElementById(id).classList.add('hidden'); }

// Init
document.addEventListener('DOMContentLoaded', () => {
    // Ensure all data exists
    ['omni_settings', 'omni_tasks', 'omni_projects', 'omni_income', 'omni_roadmap'].forEach(k => loadData(k));
    
    renderLayout();
    applyTheme();

    // Preloader Logic
    setTimeout(() => {
        const p = document.getElementById('preloader');
        if(p) { p.style.opacity = '0'; setTimeout(()=>p.remove(), 500); }
    }, 1500);

    // Dispatch event to local page scripts
    document.dispatchEvent(new Event('omniReady'));
});T