export declare class IPCClient {
    private handlerName;
    private ipcHandlePath;
    constructor(handlerName: string);
    call(request: any): Promise<any>;
}
