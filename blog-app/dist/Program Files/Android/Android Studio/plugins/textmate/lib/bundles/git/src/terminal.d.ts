import { ExtensionContext } from 'vscode';
export declare class TerminalEnvironmentManager {
    private readonly context;
    private readonly env;
    private readonly disposable;
    private _enabled;
    private set enabled(value);
    constructor(context: ExtensionContext, env: {
        [key: string]: string;
    });
    private refresh;
    dispose(): void;
}
