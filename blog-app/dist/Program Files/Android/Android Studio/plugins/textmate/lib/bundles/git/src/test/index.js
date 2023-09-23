"use strict";
const path = require('path');
const testRunner = require('../../../../test/integration/electron/testrunner');
const options = {
    ui: 'tdd',
    color: true,
    timeout: 60000
};
let suite = '';
if (process.env.VSCODE_BROWSER) {
    suite = `${process.env.VSCODE_BROWSER} Browser Integration Git Tests`;
}
else if (process.env.REMOTE_VSCODE) {
    suite = 'Remote Integration Git Tests';
}
else {
    suite = 'Integration Git Tests';
}
if (process.env.BUILD_ARTIFACTSTAGINGDIRECTORY) {
    options.reporter = 'mocha-multi-reporters';
    options.reporterOptions = {
        reporterEnabled: 'spec, mocha-junit-reporter',
        mochaJunitReporterReporterOptions: {
            testsuitesTitle: `${suite} ${process.platform}`,
            mochaFile: path.join(process.env.BUILD_ARTIFACTSTAGINGDIRECTORY, `test-results/${process.platform}-${process.arch}-${suite.toLowerCase().replace(/[^\w]/g, '-')}-results.xml`)
        }
    };
}
testRunner.configure(options);
module.exports = testRunner;
//# sourceMappingURL=index.js.map