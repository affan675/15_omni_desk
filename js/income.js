document.addEventListener('omniReady', () => {
    document.getElementById('i-date').value = new Date().toISOString().split('T')[0];
    renderIncome();
});

function renderIncome() {
    const income = loadData('omni_income');
    const tbody = document.getElementById('income-tbody');
    tbody.innerHTML = '';
    
    let monthTotal = 0;
    let yearTotal = 0;
    const now = new Date();
    const cMonth = now.getMonth();
    const cYear = now.getFullYear();

    income.sort((a,b) => new Date(b.date) - new Date(a.date)).forEach(i => {
        const d = new Date(i.date);
        if(d.getFullYear() === cYear) {
            yearTotal += Number(i.amount);
            if(d.getMonth() === cMonth) monthTotal += Number(i.amount);
        }
        
        tbody.innerHTML += `
            <tr>
                <td>${i.date}</td>
                <td>${i.client}</td>
                <td>${i.desc}</td>
                <td>₹${i.amount}</td>
                <td><button class="btn" onclick="deleteIncome('${i.id}')"><i class="fas fa-trash"></i></button></td>
            </tr>
        `;
    });

    // Update Progress
    const mPct = Math.min((monthTotal / 10000) * 100, 100);
    const yPct = Math.min((yearTotal / 1500000) * 100, 100);
    
    document.getElementById('pb-month').style.width = `${mPct}%`;
    document.getElementById('pt-month').innerText = `₹${monthTotal} / ₹10,000 (${mPct.toFixed(1)}%)`;
    
    document.getElementById('pb-year').style.width = `${yPct}%`;
    document.getElementById('pt-year').innerText = `₹${yearTotal} / ₹15,00,000 (${yPct.toFixed(1)}%)`;

    // Trigger Chart update
    if(typeof updateIncomeChart === 'function') updateIncomeChart(income, cYear);
}

function addIncome() {
    const income = loadData('omni_income');
    const entry = {
        id: generateId(),
        client: document.getElementById('i-client').value,
        amount: Number(document.getElementById('i-amount').value),
        date: document.getElementById('i-date').value,
        desc: document.getElementById('i-desc').value
    };
    if(!entry.client || !entry.amount) return alert('Fill required fields');
    
    income.push(entry);
    saveData('omni_income', income);
    
    document.getElementById('i-client').value = '';
    document.getElementById('i-amount').value = '';
    document.getElementById('i-desc').value = '';
    
    renderIncome();
}

function deleteIncome(id) {
    if(!confirm('Delete record?')) return;
    saveData('omni_income', loadData('omni_income').filter(i => i.id !== id));
    renderIncome();
}