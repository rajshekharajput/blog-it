import { UriHandler, Uri } from 'vscode';
export declare class GitProtocolHandler implements UriHandler {
    private disposables;
    constructor();
    handleUri(uri: Uri): void;
    private clone;
    dispose(): void;
}
