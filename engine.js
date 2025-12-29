const DoctorEngine = require('./doctor');
const QuestionGenerator = require('./engines/questionGenerator');
const QualityControlEngine = require('./engines/qualityControl');

// Initialize Singletons
const doctor = new DoctorEngine();
const qGen = new QuestionGenerator(doctor);
const qcEngine = new QualityControlEngine();

// Config
const MAX_TURNS = 60; // Increased Depth
let currentTurn = 0;

// We keep the loadModule signature to not break server.js immediately, 
// but we don't strictly need static JSON modules anymore for the core logic.
function loadModule(moduleName) {
    console.log(`[Tier 3 Engine] Ready for module: ${moduleName}`);
}

function startSession(moduleName) {
    // Reset global session state (Basic Singleton logic)
    currentTurn = 0;
    console.log(`[Tier 3 Engine] Session Started. Reset turn count.`);

    // Return the first dynamic question from the generator
    // We mock an empty history to get the starter question.
    return {
        id: 'start_age', // Custom ID for the first q
        text: "Select your age range to begin calibration:",
        type: 'slider',
        min: 10,
        max: 90
    };
}

async function getNextStep(currentId, answerValue, history, mode = 'sim') {
    currentTurn++;

    // 1. QC Analysis
    qcEngine.analyzeStep({ id: currentId, answer: answerValue }, history);

    // 2. Map Data
    const fullData = mapHistoryToData(history);

    // 3. Run Doctor Analysis (Real-time update)
    const diagnosisState = doctor.consult(fullData);

    // 4. Check Termination
    if (currentTurn >= MAX_TURNS) {
        return await generateSummary(diagnosisState, mode);
    }

    // 5. Generate Next Question
    const nextQ = await qGen.generateNextQuestion(history, diagnosisState, mode);

    if (!nextQ) {
        // No more questions from generator -> finish
        return await generateSummary(diagnosisState, mode);
    }

    return {
        ...nextQ,
        progress: history.length + 1
    };
}

// --- Helper: Mappers ---

function mapHistoryToData(history) {
    // Transforms history array into the structured input the Doctor expects.
    // We now handle the specific IDs from questions_db.js

    const data = {
        pain: { locations: [], quality: [], aggravators: [], pain_level: 0 },
        mobility: {},
        posture: {},
        sleep: { hours: 7, consistency: 'good' }, // defaults
        stress: { stress_level: 0, fear_movement: false },
        cardio: {},
        strength: {},
        ergo: {},
        nutrition: {},
        profile: { age: 30 }
    };

    history.forEach(h => {
        const val = h.answer.toString().toLowerCase();
        const numVal = parseInt(val) || 0;
        const isYes = val === 'yes';

        // --- PAIN ---
        if (h.id === 'p_loc') data.pain.locations.push(val);
        if (h.id === 'p_qual') data.pain.quality.push(val);
        if (h.id === 'p_int_rest') data.pain.pain_level = Math.max(data.pain.pain_level, numVal);
        if (h.id === 'p_int_move') data.pain.pain_level = Math.max(data.pain.pain_level, numVal);
        // Aggravator mapping
        if (h.id === 'p_trig_sit' && isYes) data.pain.aggravators.push('sitting');
        if (h.id === 'p_trig_stand' && isYes) data.pain.aggravators.push('standing');
        if (h.id === 'p_trig_walk' && isYes) data.pain.aggravators.push('walking');

        // --- PROFILE ---
        if (h.id === 'age') data.profile.age = numVal;

        // --- SPECIALIST MAPPINGS (Simplified) ---
        // For these, we might aggregate "Yes" answers to lower the score in the Specialist Engine
        // Since the current specialist engines expect specific keys, we will inject a generic keys 
        // that the specialists *could* use if we updated them, 
        // OR we can simple pre-calculate some "score penalties" here if we don't want to touch all 12 classes.

        // Let's pass the raw values for the Doctor to use if needed, but primarily 
        // we'll map the "Rate X" sliders to the module scores directly for immediate visual feedback.

        if (h.id === 'm_rate') data.mobility.score = (10 - numVal) * 10; // Invert: 10 limitation = 0 score
        if (h.id === 's_qual') data.sleep.score = numVal * 10;
        if (h.id === 'str_lvl') data.stress.stress_level = numVal;
        if (h.id === 'c_rate') data.cardio.score = numVal * 10;
        if (h.id === 'st_rate') data.strength.score = numVal * 10;
        if (h.id === 'n_rate') data.nutrition.score = numVal * 10;
        if (h.id === 'e_risk') data.ergo.score = (10 - numVal) * 10;

        // Specific Boolean Flags for Logic
        if (h.id === 's_dur') {
            if (val.includes('< 5')) data.sleep.hours = 4;
            if (val.includes('5-7')) data.sleep.hours = 6;
            if (val.includes('7-9')) data.sleep.hours = 8;
        }
        if (h.id === 'm_fear' && isYes) data.stress.fear_movement = true;

        // --- ROS MAPPINGS ---
        // These feed into the Red Flag Engine and Doctor's Safety checks
        if (isYes) {
            if (h.id === 'ros_fever') data.pain.red_flags_symptoms = (data.pain.red_flags_symptoms || []).concat('Fever');
            if (h.id === 'ros_weight') data.pain.red_flags_symptoms = (data.pain.red_flags_symptoms || []).concat('Unexplained Weight Loss');
            if (h.id === 'ros_sweat') data.pain.red_flags_symptoms = (data.pain.red_flags_symptoms || []).concat('Night Sweats');
            if (h.id === 'neuro_numb') data.pain.red_flags_symptoms = (data.pain.red_flags_symptoms || []).concat('Numbness');
            if (h.id === 'neuro_weak_foc') data.pain.red_flags_symptoms = (data.pain.red_flags_symptoms || []).concat('Focal Weakness');

            if (h.id === 'ros_malaise') data.stress.malaise = true;
            if (h.id === 'psy_dep') data.stress.depression_screen = true;
            if (h.id === 'psy_anx') data.stress.anxiety_screen = true;

            // --- HOLISTIC MAPPINGS ---
            // Vision
            if (h.id === 'vis_strain') data.ergo.eye_strain = true; // Map to Ergo
            if (h.id === 'vis_blur') data.pain.red_flags_symptoms = (data.pain.red_flags_symptoms || []).concat('Blurred Vision');

            // GI
            if (h.id === 'gi_bloat') data.nutrition.bloating = true;

            // Cardio History
            if (h.id === 'ch_bp') data.cardio.risk_factors = (data.cardio.risk_factors || []).concat('Hypertension');
            if (h.id === 'ch_palp') data.cardio.risk_factors = (data.cardio.risk_factors || []).concat('Palpitations');

            // Psych Behavioral
            if (h.id === 'psy_anger') data.stress.irritability = true;
            if (h.id === 'psy_withdraw') data.stress.social_withdrawal = true;

            // Habits
            if (h.id === 'hab_smoke') data.cardio.risk_factors = (data.cardio.risk_factors || []).concat('Smoking');
        }
    });

    return data;
}

async function generateSummary(diagnosisState, mode = 'sim') {
    // 1. Try AI Report if requested
    if (mode === 'ai') {
        const LLMClient = require('./engines/llmClient');
        const llm = new LLMClient();
        const aiReport = await llm.generateReport(diagnosisState.fullData || [], diagnosisState);

        if (aiReport) {
            return {
                diagnosis: aiReport.diagnosis_title,
                severity: (diagnosisState.modules.pain.score < 50) ? "Severe" : "Moderate", // Keep algo severity or ask LLM
                redFlags: diagnosisState.safety.flags.map(f => `${f.condition.toUpperCase()} Risk`),
                scores: diagnosisState.scores,
                soapd: aiReport.soap,
                explanation: aiReport.explanation_for_patient, // New field
                isAI: true
            };
        }
    }

    // 2. Fallback / Sim Mode (Rule-Based)
    const primary = diagnosisState.diagnosis.primary;
    const severity = (diagnosisState.modules.pain.score < 50) ? "Severe" : "Moderate";

    const soap = diagnosisState.soap_report;
    const redFlags = diagnosisState.safety.flags.map(f => `${f.condition.toUpperCase()} Risk`);

    // Get Quality Control Report
    const qualityReport = qcEngine.getReliabilityReport();

    return {
        diagnosis: primary.replace(/_/g, " ").toUpperCase(),
        severity: severity,
        redFlags: redFlags,
        scores: diagnosisState.scores,
        quality_control: qualityReport, // Added QC Report
        soapd: {
            S: soap.S, // Explictly include Subjective
            O: soap.O, // Explicitly include Objective
            A: soap.A,
            P: soap.P
        },
        explanation: `Based on the clinical presentation, the primary hypothesis is ${primary.replace(/_/g, " ")}. This is consistent with a ${severity} presentation. Recovery is estimated at ${diagnosisState.prognosis.weeks_min} weeks with adherence to the plan.`,
        isAI: false
    };
}

// Direct Summary Generation for Finish Early
async function getSummaryNow(history, mode = 'sim') {
    const fullData = mapHistoryToData(history || []);
    const diagnosisState = doctor.consult(fullData);
    diagnosisState.fullData = history; // Pass raw history for LLM context
    return await generateSummary(diagnosisState, mode);
}

module.exports = { loadModule, startSession, getNextStep, getSummaryNow };
