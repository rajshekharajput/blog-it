import { OutputChannel, Disposable } from 'vscode';
import { IIPCHandler } from './ipc/ipcServer';
import { CredentialsProvider } from './api/git';
export declare class Askpass implements IIPCHandler {
    private ipc?;
    private disposable;
    private cache;
    private credentialsProviders;
    static create(outputChannel: OutputChannel, context?: string): Promise<Askpass>;
    private constructor();
    handle({ request, host }: {
        request: string;
        host: string;
    }): Promise<string>;
    getEnv(): {
        [key: string]: string;
    };
    registerCredentialsProvider(provider: CredentialsProvider): Disposable;
    dispose(): void;
}
