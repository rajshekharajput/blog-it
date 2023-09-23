import { Disposable } from 'vscode';
export interface IIPCHandler {
    handle(request: any): Promise<any>;
}
export declare function createIPCServer(context?: string): Promise<IIPCServer>;
export interface IIPCServer extends Disposable {
    readonly ipcHandlePath: string | undefined;
    getEnv(): {
        [key: string]: string;
    };
    registerHandler(name: string, handler: IIPCHandler): Disposable;
}
