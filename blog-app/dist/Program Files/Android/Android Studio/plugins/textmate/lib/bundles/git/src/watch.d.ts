import { Event, Uri } from 'vscode';
import { IDisposable } from './util';
export interface IFileWatcher extends IDisposable {
    readonly event: Event<Uri>;
}
export declare function watch(location: string): IFileWatcher;
