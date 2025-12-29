const KnowledgeBase = require('./knowledgeBase');
const DifferentialDiagnosisEngine = require('./engines/differentialDiagnosis');
const RedFlagEngine = require('./engines/redFlags');
const RecoveryTrajectoryEngine = require('./engines/recovery');
const Specialists = require('./engines/specialists');

class DoctorEngine {
    constructor() {
        this.kb = new KnowledgeBase();
        this.ddx = new DifferentialDiagnosisEngine(this.kb);
        this.redFlags = new RedFlagEngine(this.kb);
        this.trajectory = new RecoveryTrajectoryEngine();

        // Specialist Engines
        this.painSpec = new Specialists.AdvancedPainEngine(this.kb);
        this.mobSpec = new Specialists.AdvancedMobilityEngine();
        this.postSpec = new Specialists.AdvancedPostureEngine();
        this.sleepSpec = new Specialists.AdvancedSleepEngine();
        this.bpsSpec = new Specialists.BiopsychosocialEngine();
        this.crdSpec = new Specialists.AdvancedCardioEngine();
        this.strSpec = new Specialists.AdvancedStrengthEngine();
        this.nutSpec = new Specialists.AdvancedNutritionEngine();
        this.histSpec = new Specialists.AdvancedHistoryEngine();
        this.ergoSpec = new Specialists.ErgoEngine();
        this.physSpec = new Specialists.PhysiqueEngine();
    }

    consult(fullData) {
        // Run all engines
        const safety = this.redFlags.scan(fullData);
        const rPain = this.painSpec.analyze(fullData.pain || {});
        const rMob = this.mobSpec.analyze(fullData.mobility || {});
        const rPost = this.postSpec.analyze(fullData.posture || {});
        const rSleep = this.sleepSpec.analyze(fullData.sleep || {});
        const rBps = this.bpsSpec.analyze(fullData.social || {}, fullData.stress || {});
        const rCardio = this.crdSpec.analyze(fullData.cardio || {});
        const rStr = this.strSpec.analyze(fullData.strength || {});
        const rNut = this.nutSpec.analyze(fullData.nutrition || {});
        const rHist = this.histSpec.analyze(fullData.history || {});
        const rErgo = this.ergoSpec.analyze(fullData.ergo || {});
        const rPhys = this.physSpec.analyze(fullData.physique || {});

        // Differential Diagnosis
        const symptomSnapshot = {
            locations: (fullData.pain || {}).locations || [],
            quality: (fullData.pain || {}).quality || [],
            aggravators: (fullData.pain || {}).aggravators || []
        };
        const dx = this.ddx.analyze(symptomSnapshot);

        // Prognosis
        const primaryDx = (dx && dx.length > 0) ? dx[0][0] : "Undetermined Mechanical Pain";
        const prognosis = this.trajectory.predict(primaryDx, 'moderate', { age: (fullData.profile || {}).age || 30 });

        // SOAP Note Generation
        const soap = {
            "S": `Patient reports ${rPain.type} pain (Level ${10 - rPain.score / 10}). Psychosocial load: ${rBps.allostatic_load}/10.`,
            "O": `Functional Movement Score: ${rMob.score}/100. Posture: ${rPost.syndromes.join(', ') || 'Neutral'}.`,
            "A": `Primary Diag: ${primaryDx}. Risk Profile: ${rMob.injury_risk}. Prognosis: ${prognosis.weeks_min} weeks.`,
            "P": `Focus: ${rStr.training_priority}. Interventions: ${rSleep.hygiene_protocol.join(', ') || 'Monitor'}.`
        };

        return {
            safety: safety,
            diagnosis: { top_candidates: dx, primary: primaryDx },
            prognosis: prognosis,
            modules: {
                pain: rPain, mobility: rMob, posture: rPost, sleep: rSleep,
                psychosocial: rBps, cardio: rCardio, strength: rStr,
                nutrition: rNut, history: rHist, ergo: rErgo, physique: rPhys
            },
            scores: {
                "Pain": rPain.score,
                "Mobility": rMob.score,
                "Posture": rPost.score,
                "Sleep": rSleep.score,
                "Stress": rBps.score,
                "Cardio": rCardio.score,
                "Strength": rStr.score,
                "Ergo": rErgo.score,
                "Nutrition": rNut.score
            },
            soap_report: soap
        };
    }
}

module.exports = DoctorEngine;
