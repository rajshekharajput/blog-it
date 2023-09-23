import { Uri } from 'vscode';
export interface GitUriParams {
    path: string;
    ref: string;
    submoduleOf?: string;
}
export declare function isGitUri(uri: Uri): boolean;
export declare function fromGitUri(uri: Uri): GitUriParams;
export interface GitUriOptions {
    replaceFileExtension?: boolean;
    submoduleOf?: string;
}
export declare function toGitUri(uri: Uri, ref: string, options?: GitUriOptions): Uri;
