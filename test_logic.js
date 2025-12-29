const engine = require('./engine');

async function runTest() {
    console.log("=== STARTING PHYSIO LOGIC TEST ===");

    // 1. Start Session
    const startQ = engine.startSession('knee');
    console.log("Start Question:", startQ.text);

    // 2. Simulate User Answers (Classic Sciatica/Disc case)
    let history = [];
    let currentQ = startQ;

    // Simulation mapping
    // We will just feed answers sequentially based on what QuestionGenerator likely asks
    // But since QGen is dynamic, we need to adapt.
    // For this test, we'll force-feed specific history items to 'engine.getNextStep' 
    // to see if it correctly deduces the diagnosis.

    const simulatedAnswers = [
        { id: 'age', answer: 45, text: "45" },
        { id: 'pain_location', answer: 'Low Back, Leg', text: "Low Back and Leg" },
        { id: 'pain_quality', answer: 'Shooting', text: "Shooting/Electric" },
        { id: 'aggravators', answer: 'Sitting', text: "Sitting" },
        { id: 'pain_level', answer: 8, text: "8/10" }
    ];

    console.log("\n--- Simulating Conversation ---");

    for (const step of simulatedAnswers) {
        history.push(step);
        console.log(`User Answered: ${step.id} -> ${step.answer}`);

        const response = await engine.getNextStep('dummy_id', step.answer, history);

        if (response.complete) {
            console.log("\n=== DIAGNOSIS COMPLETE ===");
            console.log("Primary Diagnosis:", response.summary.diagnosis);
            console.log("Severity:", response.summary.severity);
            console.log("Red Flags:", response.summary.redFlags);
            console.log("Scores:", JSON.stringify(response.summary.scores, null, 2));
            console.log("SOAP A:", response.summary.soapd.A);
            return;
        } else {
            console.log(`Next Question [${response.id}]: ${response.text}`);
        }
    }

    console.log("\n Test ended without completion (expected if not enough info provided).");
}

runTest();
