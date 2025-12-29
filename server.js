const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');
const engine = require('./engine');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, '.'))); // Serve static files from root

// --- Basic Authentication Middleware ---
app.use((req, res, next) => {
    const user = process.env.SHARE_USER;
    const pass = process.env.SHARE_PASS;
    if (!user || !pass) return next(); // No protection if env vars not set

    const b64auth = (req.headers.authorization || '').split(' ')[1] || '';
    const [login, password] = Buffer.from(b64auth, 'base64').toString().split(':');

    if (login && password && login === user && password === pass) {
        return next();
    }

    res.set('WWW-Authenticate', 'Basic realm="Physio App"');
    res.status(401).send('Authentication required to access this Doctor Survey.');
});

// Load the Knee Module on startup (in a real app this might be dynamic)
engine.loadModule('knee');
// engine.loadModule('back'); // Placeholder for future

// API: Start a new session
app.post('/api/start', (req, res) => {
    // In a real DB, we'd create a session ID. 
    // Here we just return the 'root' question of the requested module.
    const moduleName = req.body.module || 'knee';
    const firstQuestion = engine.startSession(moduleName);
    res.json(firstQuestion);
});

// API: Process answer and get next question
app.post('/api/next', async (req, res) => {
    const { currentQuestionId, answerValue, history, mode } = req.body;

    try {
        // Logic to determine next question
        const nextStep = await engine.getNextStep(currentQuestionId, answerValue, history, mode);

        // If nextStep has a 'diagnosis' or 'summary' field, the survey is done.
        // FIX: The frontend expects { complete: true, summary: ... }
        if (nextStep.diagnosis || nextStep.summary) {
            res.json({ complete: true, summary: nextStep });
        } else {
            res.json(nextStep);
        }
    } catch (err) {
        console.error("Error in /api/next:", err);
        res.status(500).json({ error: "Internal Server Error" });
    }
});

// API: Force finish and get summary
app.post('/api/finish', async (req, res) => {
    const { history, mode } = req.body;
    // Generate summary based on current history
    const summary = await engine.getSummaryNow(history, mode);
    res.json(summary);
});

app.listen(port, () => {
    console.log(`Physio AI Server running at http://localhost:${port}`);
});
