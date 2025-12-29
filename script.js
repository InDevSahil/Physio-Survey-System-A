const API_URL = 'http://localhost:3000/api';
const chatArea = document.getElementById('chatArea');
const controls = document.getElementById('controls');
const progressFill = document.getElementById('progressFill');
const typing = document.getElementById('typing');

let currentQuestionId = null;
let history = [];
let selectedMode = 'sim'; // Default

function selectMode(mode) {
    selectedMode = mode;
    document.getElementById('mode-selection').style.display = 'none';
    document.getElementById('controls').style.display = 'block';
    startSurvey();
}

async function startSurvey() {
    controls.innerHTML = '';
    showTyping(true);
    document.getElementById('finishBtn').style.display = 'block'; // Show finish button

    // Initial message based on mode
    addMessage(selectedMode === 'ai' ? "Starting Advanced AI Assessment..." : "Starting Standard Simulation Assessment...", 'bot');

    try {
        const response = await fetch(`${API_URL}/start`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ module: 'knee' }) // Start is generic
        });
        const question = await response.json();
        showTyping(false);
        renderQuestion(question);
    } catch (err) {
        showError("Failed to connect to AI Doctor server.");
    }
}

async function finishEarly() {
    if (!confirm("Are you sure you want to finish the assessment and generate the report now?")) return;

    showTyping(true);
    controls.innerHTML = '';

    // We send a special request to get the summary immediately
    try {
        const response = await fetch(`${API_URL}/finish`, { // New endpoint
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ history: history, mode: selectedMode })
        });
        const summary = await response.json();
        showTyping(false);
        renderSummary(summary);
        document.getElementById('finishBtn').style.display = 'none';
    } catch (err) {
        showError("Failed to generate report.");
    }
}

async function submitAnswer(answerValue, answerText) {
    // 1. Show user answer
    addMessage(answerText, 'user');
    history.push({ id: currentQuestionId, answer: answerValue, text: answerText });

    // 2. Clear controls and show typing
    controls.innerHTML = '';
    showTyping(true);

    // 3. Update Progress (Visual only for now)
    const currentPercent = parseFloat(progressFill.style.width) || 0;
    progressFill.style.width = Math.min(currentPercent + 5, 100) + '%';

    // 4. Send to server
    try {
        const response = await fetch(`${API_URL}/next`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                currentQuestionId: currentQuestionId,
                answerValue: answerValue,
                history: history,
                mode: selectedMode // Pass the mode
            })
        });
        const nextStep = await response.json();

        showTyping(false);

        if (nextStep.complete) {
            renderSummary(nextStep.summary);
        } else {
            renderQuestion(nextStep);
        }

    } catch (err) {
        showError("Error processing answer.");
        console.error(err);
    }
}

function renderQuestion(step) {
    currentQuestionId = step.id;

    // 1. Render Bot Question
    if (step.text) {
        addMessage(step.text, 'bot');
    }

    // 2. Clear Controls
    controls.innerHTML = '';
    const optionsGrid = document.createElement('div');
    optionsGrid.className = 'options-grid';

    // 3. Render Inputs
    if (step.type === 'mcq') {
        step.options.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'option-btn';
            btn.innerText = opt;
            btn.onclick = () => submitAnswer(opt, opt);
            optionsGrid.appendChild(btn);
        });
    } else if (step.type === 'slider') {
        const container = document.createElement('div');
        container.className = 'slider-container';

        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = step.min;
        slider.max = step.max;
        slider.value = (step.min + step.max) / 2;

        const valDisplay = document.createElement('div');
        valDisplay.className = 'slider-value';
        valDisplay.innerText = slider.value;
        slider.oninput = (e) => valDisplay.innerText = e.target.value;

        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.innerText = "Confirm";
        btn.onclick = () => submitAnswer(parseInt(slider.value), slider.value);

        container.appendChild(valDisplay);
        container.appendChild(slider);
        container.appendChild(btn);
        optionsGrid.appendChild(container);
    }

    controls.appendChild(optionsGrid);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function renderSummary(summary) {
    addMessage("Diagnosis Complete. Generating Report...", 'bot');

    // Create rich summary card
    const card = document.createElement('div');
    card.className = 'message bot summary-card';
    card.innerHTML = `
        <h3>Diagnosis Summary</h3>
        <p><strong>Assessment:</strong> ${summary.diagnosis}</p>
        <p><strong>Severity:</strong> ${summary.severity}</p>
        ${summary.redFlags.length > 0 ? `<div class="red-flag">⚠️ Alerts: ${summary.redFlags.join(', ')}</div>` : ''}
        
        <div style="width: 100%; height: 300px; margin: 20px 0;">
            <canvas id="scoresChart"></canvas>
        </div>

        <hr>

        <!-- AI Explanation (New) -->
        ${summary.explanation ? `
        <div style="background: #e8f4fd; padding: 15px; border-left: 4px solid #3498db; margin-bottom: 20px;">
            <h4>Dr. Physio's Note:</h4>
            <p>${summary.explanation}</p>
        </div>
        ` : ''}
        
        <!-- Quality Control Section -->
        ${summary.quality_control ? `
        <div style="background: #f8f9fa; padding: 10px; border-radius: 5px; font-size: 0.9em;">
            <p><strong>Reliability Score:</strong> ${summary.quality_control.score}% 
               ${summary.quality_control.isReliable ? '✅' : '⚠️'}</p>
            ${summary.quality_control.warnings.length > 0 ? `<p style="color:orange"><em>Note: ${summary.quality_control.warnings[0]}</em></p>` : ''}
            ${summary.quality_control.flags.length > 0 ? `<p style="color:red"><strong>Alert: ${summary.quality_control.flags[0]}</strong></p>` : ''}
        </div>
        <hr>
        ` : ''}

        <h4>Clinical SOAP Report</h4>
        <p><strong>Subjective (S):</strong> ${summary.soapd.S || summary.soapd.A}</p> 
        <p><strong>Objective (O):</strong> ${summary.soapd.O || 'Computed from metrics.'}</p>
        <p><strong>Assessment (A):</strong> ${summary.soapd.A}</p>
        <p><strong>Plan (P):</strong> ${summary.soapd.P}</p>
    `;
    chatArea.appendChild(card);

    // Render Chart
    if (summary.scores) {
        setTimeout(() => {
            const ctx = document.getElementById('scoresChart').getContext('2d');
            new Chart(ctx, {
                type: 'radar',
                data: {
                    labels: Object.keys(summary.scores),
                    datasets: [{
                        label: 'Health Profile',
                        data: Object.values(summary.scores),
                        fill: true,
                        backgroundColor: 'rgba(54, 162, 235, 0.2)',
                        borderColor: 'rgb(54, 162, 235)',
                        pointBackgroundColor: 'rgb(54, 162, 235)',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: 'rgb(54, 162, 235)'
                    }]
                },
                options: {
                    scales: {
                        r: {
                            min: 0,
                            max: 100,
                            ticks: { showLabelBackdrop: false }
                        }
                    },
                    responsive: true,
                    maintainAspectRatio: false
                }
            });
        }, 100);
    }

    chatArea.scrollTop = chatArea.scrollHeight;
}

function addMessage(text, type) {
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.innerText = text;
    chatArea.appendChild(div);
    chatArea.scrollTop = chatArea.scrollHeight;
}

function showTyping(show) {
    typing.style.display = show ? 'block' : 'none';
}

function showError(msg) {
    addMessage("Error: " + msg, 'bot');
    showTyping(false);
}
