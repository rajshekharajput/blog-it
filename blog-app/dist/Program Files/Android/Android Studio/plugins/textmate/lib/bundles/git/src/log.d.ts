import { Event } from 'vscode';
export declare enum LogLevel {
    Trace = 1,
    Debug = 2,
    Info = 3,
    Warning = 4,
    Error = 5,
    Critical = 6,
    Off = 7
}
export declare const Log: {
    logLevel: LogLevel;
    readonly onDidChangeLogLevel: Event<LogLevel>;
};
