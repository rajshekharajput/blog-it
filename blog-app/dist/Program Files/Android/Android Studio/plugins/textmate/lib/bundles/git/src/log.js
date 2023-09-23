"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Log = exports.LogLevel = void 0;
const vscode_1 = require("vscode");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["Trace"] = 1] = "Trace";
    LogLevel[LogLevel["Debug"] = 2] = "Debug";
    LogLevel[LogLevel["Info"] = 3] = "Info";
    LogLevel[LogLevel["Warning"] = 4] = "Warning";
    LogLevel[LogLevel["Error"] = 5] = "Error";
    LogLevel[LogLevel["Critical"] = 6] = "Critical";
    LogLevel[LogLevel["Off"] = 7] = "Off";
})(LogLevel = exports.LogLevel || (exports.LogLevel = {}));
let _logLevel = LogLevel.Info;
const _onDidChangeLogLevel = new vscode_1.EventEmitter();
exports.Log = {
    get logLevel() {
        return _logLevel;
    },
    set logLevel(logLevel) {
        if (_logLevel === logLevel) {
            return;
        }
        _logLevel = logLevel;
        _onDidChangeLogLevel.fire(logLevel);
    },
    get onDidChangeLogLevel() {
        return _onDidChangeLogLevel.event;
    }
};
//# sourceMappingURL=log.js.map