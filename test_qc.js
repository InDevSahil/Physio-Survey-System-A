const QualityControlEngine = require('./engines/qualityControl');

function testQC() {
    console.log("Testing QC Engine Output...");
    const qc = new QualityControlEngine();
    const report = qc.getReliabilityReport();

    console.log("QC Report Keys:", Object.keys(report));

    if (report.hasOwnProperty('score') && report.hasOwnProperty('isReliable')) {
        console.log("PASS: QC Report has correct fields.");
    } else {
        console.log("FAIL: QC Report missing fields.");
    }
}

testQC();
