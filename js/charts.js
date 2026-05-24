// Centralized Chart logic to avoid errors on pages where canvas doesn't exist
const chartColors = {
    primary: getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#6366F1',
    secondary: getComputedStyle(document.documentElement).getPropertyValue('--secondary').trim() || '#10B981',
    text: getComputedStyle(document.documentElement).getPropertyValue('--text').trim() || '#1E293B'
};

let mainChartInstance = null;
let dashChartInstance = null;

// Dashboard Doughnut
function initDashChart(monthIncome) {
    const ctx = document.getElementById('dashIncomeChart');
    if(!ctx) return;
    
    if(dashChartInstance) dashChartInstance.destroy();
    
    const target = 10000;
    const remain = Math.max(target - monthIncome, 0);
    
    dashChartInstance = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Earned', 'Remaining'],
            datasets: [{
                data: [monthIncome, remain],
                backgroundColor: [chartColors.secondary, chartColors.primary],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: chartColors.text } } }
        }
    });
}

// Income Page Bar Chart
function updateIncomeChart(incomeData, currentYear) {
    const ctx = document.getElementById('incomeMainChart');
    if(!ctx) return;

    // Group by month
    const months = Array(12).fill(0);
    incomeData.forEach(i => {
        const d = new Date(i.date);
        if(d.getFullYear() === currentYear) {
            months[d.getMonth()] += Number(i.amount);
        }
    });

    if(mainChartInstance) mainChartInstance.destroy();

    mainChartInstance = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'],
            datasets: [{
                label: 'Monthly Income (₹)',
                data: months,
                backgroundColor: chartColors.primary,
                borderRadius: 4
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
                y: { beginAtZero: true, ticks: { color: chartColors.text } },
                x: { ticks: { color: chartColors.text } }
            },
            plugins: { legend: { display: false } }
        }
    });
}